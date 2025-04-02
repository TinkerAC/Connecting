import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

/**
 * 定义基本账号接口
 */
interface Account {
    name: string;
    email: string;
    id: number;
    token: string;
}

/**
 * 定义通过 exp2 目录注册的测试用户接口
 */
interface RegisteredUser {
    studentNumber: string;
    name: string;
    email: string;
    token: string;
    folderPath: string;
}

const baseUrl = 'http://localhost:3000/api';

/**
 * 原始注册流程：
 * 1. 注册并登录管理员（admin@zufe.edu.cn，密码：admin）
 * 2. 注册 10 个学生（邮箱如 s1@example.com）
 * 3. 注册 5 个教师（邮箱如 t1@zufe.edu.cn）
 * 4. 创建 4 门课程（包括“操作系统”），随机分配教师
 * 5. 每个学生随机报名 2 门课程
 */
async function originalRegistrationFlow() {
    // 1. 管理员注册及登录
    let adminAccount: Account;
    try {
        await axios.post(`${baseUrl}/auth/register`, {
            name: "Admin",
            email: "admin@zufe.edu.cn",
            password: "admin",
            role: "admin"
        });
        console.log("注册管理员成功：admin@zufe.edu.cn");

        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: "admin@zufe.edu.cn",
            password: "admin"
        });
        const adminData = loginRes.data.data;
        adminAccount = {
            name: adminData.name,
            email: adminData.email,
            id: adminData.id,
            token: adminData.token
        };
        console.log("管理员登录成功：", adminAccount);
    } catch (err: any) {
        console.error("管理员注册或登录失败：", err.response?.data || err);
        throw err;
    }

    // 3. 注册 5 个教师（t1～t5，邮箱：t1@zufe.edu.cn 等）
    const teacherAccounts: Account[] = [];
    for (let i = 1; i <= 5; i++) {
        const email = `t${i}@zufe.edu.cn`;
        try {
            await axios.post(`${baseUrl}/auth/register`, {
                name: `Teacher ${i}`,
                email,
                password: `t${i}`,
                role: "teacher"
            });
            console.log(`注册教师成功：${email}`);

            const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                email,
                password: `t${i}`
            });
            const data = loginRes.data.data;
            teacherAccounts.push({
                name: data.name,
                email: data.email,
                id: data.id,
                token: data.token
            });
        } catch (err: any) {
            console.error(`注册教师 ${email} 失败：`, err.response?.data || err);
        }
    }

    // 4. 创建 4 门课程（包括“操作系统”）
    const courseNames = ["计算机网络", "数据结构", "计算机组成原理", "操作系统"];
    const courses: any[] = [];
    for (const courseName of courseNames) {
        // 随机选择一位教师作为课程负责人
        const randomTeacher = teacherAccounts[Math.floor(Math.random() * teacherAccounts.length)];
        try {
            const courseRes = await axios.post(
                `${baseUrl}/courses`,
                {
                    title: courseName,
                    description: `${courseName} 描述`,
                    teacherId: randomTeacher.id
                },
                {
                    headers: {Authorization: `Bearer ${adminAccount.token}`}
                }
            );
            console.log(`创建课程成功：${courseName}（负责人：${randomTeacher.email}）`);
            // 根据后端返回数据结构可能在 data.course 或 data 中
            const course = courseRes.data.data.course || courseRes.data.data;
            courses.push(course);
        } catch (err: any) {
            console.error(`创建课程 ${courseName} 失败：`, err.response?.data || err);
        }
    }


    return {
        adminAccount,
        teacherAccounts,
        courses
    };
}

/**
 * 从 assets/exp2 目录中注册测试学生用户
 * 文件夹名称格式：\d{12}-(name)\(\d{12}\)
 * 构造邮箱为 学号@zufe.edu.cn，默认密码为 "123456"
 */
async function registerUsersFromExp2(): Promise<RegisteredUser[]> {
    const exp2Dir = path.resolve(__dirname, 'assets/exp2');
    let folders: string[] = [];
    try {
        folders = await fs.readdir(exp2Dir);
    } catch (err) {
        console.error("读取 exp2 目录出错：", err);
        return [];
    }
    const registeredUsers: RegisteredUser[] = [];
    const folderNameRegex = /^(\d{12})-(.+)\(\d{12}\)$/;
    for (const folderName of folders) {
        const match = folderName.match(folderNameRegex);
        if (match) {
            const studentNumber = match[1]; // 学号
            const name = match[2]; // 姓名
            const email = `${studentNumber}@zufe.edu.cn`;
            const folderPath = path.join(exp2Dir, folderName);
            try {
                // 注册测试学生用户
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
                registeredUsers.push({studentNumber, name, email, token, folderPath});
            } catch (error: any) {
                console.error(`注册或登录测试用户 ${name} (${email}) 失败：`, error.response?.data || error);
            }
        } else {
            console.log(`文件夹名称 ${folderName} 不符合预期格式，跳过。`);
        }
    }
    return registeredUsers;
}

/**
 * 对于每个通过 exp2 注册的测试用户，
 * 从其对应文件夹中随机选择一个 .docx 文件，
 * 然后提交到操作系统第二次作业的提交接口
 * （假定接口：POST /api/assignments/{assignmentId}/submit，支持 multipart/form-data）
 */
async function submitDocxToOSAssignment(osAssignmentId: number, users: RegisteredUser[]): Promise<void> {
    for (const user of users) {
        try {
            const files = await fs.readdir(user.folderPath);
            const docxFiles = files.filter(file => file.toLowerCase().endsWith('.docx'));
            if (docxFiles.length === 0) {
                console.log(`在 ${user.folderPath} 中未找到 .docx 文件，跳过 ${user.name}。`);
                continue;
            }
            const randomFile = docxFiles[Math.floor(Math.random() * docxFiles.length)];
            const filePath = path.join(user.folderPath, randomFile);
            console.log(`用户 ${user.name} 将提交文件：${filePath}`);
            const form = new FormData();
            const fileContent = await fs.readFile(filePath);
            form.append('file', fileContent, randomFile);
            const submissionUrl = `${baseUrl}/assignments/${osAssignmentId}/submit`
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
 * 整体测试流程：
 * 1. 执行原始注册流程（管理员、教师、学生注册、课程创建、学生选课）
 * 2. 从 assets/exp2 注册测试用户
 * 3. 获取操作系统课程，并创建操作系统第二次作业（由管理员创建）
 * 4. 每个 exp2 测试用户提交随机 .docx 文件到该作业
 */
async function testFlowFull() {
    // 1. 原始注册流程
    const {adminAccount, teacherAccounts, courses} = await originalRegistrationFlow();

    // 2. 从 assets/exp2 注册测试用户
    const testUsers = await registerUsersFromExp2();
    console.log(`共注册 ${testUsers.length} 个 exp2 测试用户。`);

    // 3. 获取操作系统课程（假定课程标题为 “操作系统”）
    // 4. 创建操作系统第二次作业
    let osAssignmentId: number;

    try {
        const createRes = await axios.post(
            `${baseUrl}/assignments`,
            {
                title: "操作系统作业2",
                description: "操作系统第二次作业测试",
                courseId: 4
            },
            {
                headers: {Authorization: `Bearer ${adminAccount.token}`}
            }
        );
        console.log(createRes.data);
        // 根据返回的数据结构提取 assignment 对象
        const assignment = createRes.data.data ? createRes.data.data.assignment : createRes.data.assignment;
        osAssignmentId = assignment.id;
        console.log(`创建操作系统第二次作业成功，作业ID：${osAssignmentId}`);
    } catch (error: any) {
        console.error("创建操作系统第二次作业失败：", error.response?.data || error);
        return;
    }

    // 5. 每个 exp2 测试用户提交随机 .docx 文件到操作系统第二次作业
    await submitDocxToOSAssignment(osAssignmentId, testUsers);

    console.log("整体测试流程执行完成");
}

// 独立执行整体测试流程
(async () => {
    try {
        await testFlowFull();
    } catch (error) {
        console.error("整体测试流程执行失败：", error);
    }
})();