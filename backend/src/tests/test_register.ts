import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

/**
 * 定义测试用户接口
 */
interface RegisteredUser {
    name: string;
    email: string;
    token: string;
    folderPath: string;
}

const baseUrl = 'http://localhost:3000/api';

/**
 * 从 assets/exp2 目录中注册测试用户
 * 文件夹名称格式：\d{12}-(name)\(\d{12}\)
 * 注册时构造邮箱为 学号@zufe.edu.cn，默认密码为 "123456"，角色为 student
 */
async function registerUsersFromExp2(): Promise<RegisteredUser[]> {
    // 根据实际路径调整，此处假定相对于当前文件位置
    const exp2Dir = path.resolve(__dirname, 'assets/exp2');
    let folders: string[] = [];
    try {
        folders = await fs.readdir(exp2Dir);
    } catch (err) {
        console.error("读取 exp2 目录出错:", err);
        return [];
    }
    const registeredUsers: RegisteredUser[] = [];
    const folderNameRegex = /^(\d{12})-(.+)\(\d{12}\)$/;
    for (const folderName of folders) {
        const match = folderName.match(folderNameRegex);
        if (match) {
            const studentNumber = match[1]; // 学号（12位数字）
            const name = match[2]; // 姓名
            const email = `${studentNumber}@zufe.edu.cn`;
            const folderPath = path.join(exp2Dir, folderName);
            try {
                // 注册学生用户
                await axios.post(`${baseUrl}/auth/register`, {
                    name,
                    email,
                    password: "123456",
                    role: "student"
                });
                console.log(`注册测试学生成功：${name}，邮箱：${email}`);
                // 登录获取 token
                const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                    email,
                    password: "123456"
                });
                const token = loginRes.data.data.token;
                registeredUsers.push({name, email, token, folderPath});
            } catch (error: any) {
                console.error(`注册或登录用户 ${name} (${email}) 失败：`, error.response?.data || error);
            }
        } else {
            console.log(`文件夹名称 ${folderName} 不符合预期格式，跳过。`);
        }
    }
    return registeredUsers;
}




/**
 * 对于每个测试用户，从其对应文件夹中随机选择一个 .docx 文件，
 * 然后提交到指定作业（操作系统第二次作业）的提交接口
 */
async function submitDocxToOSAssignment(osAssignmentId: number, users: RegisteredUser[]): Promise<void> {
    for (const user of users) {
        try {
            // 读取该用户文件夹中的所有文件
            const files = await fs.readdir(user.folderPath);
            // 筛选出 .docx 文件
            const docxFiles = files.filter(file => file.toLowerCase().endsWith('.docx'));
            if (docxFiles.length === 0) {
                console.log(`在 ${user.folderPath} 中未找到 .docx 文件，跳过该用户。`);
                continue;
            }
            // 随机选择一个 .docx 文件
            const randomFile = docxFiles[Math.floor(Math.random() * docxFiles.length)];
            const filePath = path.join(user.folderPath, randomFile);
            console.log(`用户 ${user.name} 将提交文件: ${filePath}`);
            // 构造 form-data
            const form = new FormData();
            const fileContent = await fs.readFile(filePath);
            form.append('file', fileContent, randomFile);
            // 提交作业文件接口，假定 URL 为 /api/assignments/{assignmentId}/submissions
            const submissionUrl = `${baseUrl}/assignments/${osAssignmentId}/submissions`;
            const headers = {
                ...form.getHeaders(),
                Authorization: `Bearer ${user.token}`
            };
            const res = await axios.post(submissionUrl, form, {headers});
            console.log(`用户 ${user.name} 文件提交成功：`, res.data);
        } catch (error: any) {
            console.error(`用户 ${user.name} 文件提交失败：`, error.response?.data || error);
        }
    }
}

/**
 * 测试整体流程：
 * 1. 管理员登录（管理员邮箱固定为 admin@zufe.edu.cn，密码为 admin）
 * 2. 注册 assets/exp2 目录下的测试用户
 * 3. 获取操作系统课程，并创建操作系统第二次作业（由管理员创建）
 * 4. 每个测试用户提交其文件夹中的随机 .docx 文件到该作业
 */
export async function testFlowExp2() {
    // 先登录管理员账号
    let adminAccount: { email: string; id: number; token: string };
    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'admin@zufe.edu.cn',
            password: 'admin'
        });
        const adminData = loginRes.data.data;
        adminAccount = {
            email: adminData.email,
            id: adminData.id,
            token: adminData.token
        };
        console.log("管理员登录成功：", adminAccount);
    } catch (err: any) {
        console.error("管理员登录失败：", err.response?.data || err);
        return;
    }

    // 1. 注册 exp2 下的测试用户
    const testUsers = await registerUsersFromExp2();
    console.log(`共注册 ${testUsers.length} 个 exp2 测试用户。`);

    // 2. 获取操作系统课程（假定课程标题为 “操作系统”）
    let osCourse: any;
    try {
        const osCourseRes = await axios.get(`${baseUrl}/courses?title=操作系统`);
        // 假定返回数据格式为 { data: { courses: [...] } }
        const courses = osCourseRes.data.data.courses || [];
        if (courses.length === 0) {
            console.error("未找到操作系统课程。");
            return;
        }
        osCourse = courses[0];
    } catch (error: any) {
        console.error("获取操作系统课程失败：", error.response?.data || error);
        return;
    }

    // 3. 创建操作系统第二次作业
    let osAssignmentId: number;
    try {
        const createRes = await axios.post(
            `${baseUrl}/assignments`,
            {
                title: "操作系统作业2",
                description: "操作系统第二次作业测试",
                courseId: osCourse.id
            },
            {
                headers: {Authorization: `Bearer ${adminAccount.token}`}
            }
        );
        const assignment = createRes.data.data.assignment || createRes.data.data;
        osAssignmentId = assignment.id;
        console.log(`创建操作系统第二次作业成功，作业ID: ${osAssignmentId}`);
    } catch (error: any) {
        console.error("创建操作系统第二次作业失败：", error.response?.data || error);
        return;
    }

    // 4. 每个测试用户提交随机 docx 文件到操作系统第二次作业
    await submitDocxToOSAssignment(osAssignmentId, testUsers);
}

// 独立运行测试方法
(async () => {
    try {
        await testFlowExp2();
    } catch (error) {
        console.error("testFlowExp2 执行失败：", error);
    }
})();