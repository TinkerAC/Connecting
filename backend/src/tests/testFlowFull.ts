import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

/**
 * --------------------------------------------------
 * 类型声明 & 常量
 * --------------------------------------------------
 */
interface Account {
    name: string;
    email: string;
    id: number;
    token: string;
}

interface RegisteredUser {
    studentNumber: string;
    name: string;
    email: string;
    token: string;
    folderPath: string;
}

interface Course {
    id: number;
    title: string;
}

const baseUrl = 'http://localhost:3000/api';

/**
 * --------------------------------------------------
 * 工具函数：注册 + 登录（统一密码 123456）
 * --------------------------------------------------
 */
async function registerAndLogin(
    name: string,
    email: string,
    role: 'admin' | 'teacher' | 'student',
): Promise<Account> {
    const password = '123456';
    try {
        await axios.post(`${baseUrl}/auth/register`, { name, email, password, role });
    } catch (_) {
        /* 账号已存在时直接忽略注册异常 */
    }
    const loginRes = await axios.post(`${baseUrl}/auth/login`, { email, password });
    const d = loginRes.data.data;
    return { name: d.name, email: d.email, id: d.id, token: d.token };
}

/**
 * --------------------------------------------------
 * 注册各类用户
 * --------------------------------------------------
 */
export async function registerAdmin(): Promise<Account> {
    return registerAndLogin('Admin', 'admin@zufe.edu.cn', 'admin');
}

export async function registerTeachers(count = 20): Promise<Account[]> {
    const arr: Account[] = [];
    for (let i = 1; i <= count; i++) {
        arr.push(await registerAndLogin(`Teacher ${i}`, `t${i}@zufe.edu.cn`, 'teacher'));
    }
    return arr;
}

export async function registerStudentsFromExp2(): Promise<RegisteredUser[]> {
    const exp2Dir = path.resolve(__dirname, 'assets/exp2');
    let folderNames: string[] = [];
    try {
        folderNames = await fs.readdir(exp2Dir);
    } catch (e) {
        console.error('读取 exp2 目录失败：', e);
        return [];
    }
    const reg = /^(\d{12})-(.+)\(\d{12}\)$/;
    const students: RegisteredUser[] = [];
    for (const name of folderNames) {
        const m = name.match(reg);
        if (!m) continue;
        const [, stuNo, stuName] = m;
        const email = `${stuNo}@zufe.edu.cn`;
        const account = await registerAndLogin(stuName, email, 'student');
        students.push({
            studentNumber: stuNo,
            name: stuName,
            email,
            token: account.token,
            folderPath: path.join(exp2Dir, name),
        });
    }
    return students;
}

/**
 * --------------------------------------------------
 * 课程相关
 * --------------------------------------------------
 */
export async function createCourses(admin: Account, teachers: Account[]): Promise<Course[]> {
    const titles = [
        '计算机网络',
        '数据结构',
        '计算机组成原理',
        '操作系统',
        '数据库系统',
        '软件工程',
        '编译原理',
        '人工智能导论',
        '机器学习',
        '算法设计与分析',
        '信息安全',
        '分布式系统',
        '程序设计语言',
        '数据挖掘',
        '可视化技术',
        '人机交互',
        '区块链技术',
        '云计算基础',
        '计算机图形学',
        '自然语言处理',
        '高等数学',
        '线性代数',
        '概率论与数理统计',
        '数值分析',
    ];

    const list: Course[] = [];
    for (const t of titles) {
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        try {
            const res = await axios.post(
                `${baseUrl}/courses`,
                { title: t, description: `${t} 课程描述`, teacherId: teacher.id },
                { headers: { Authorization: `Bearer ${admin.token}` } },
            );
            const c = res.data.data?.course ?? res.data.course ?? res.data;
            list.push({ id: c.id, title: c.title });
            console.log(`✔ 课程创建：${t} -> ${teacher.email}`);
        } catch (err: any) {
            console.error(`✘ 创建课程 ${t} 失败：`, err.response?.data || err);
        }
    }
    return list;
}

export async function enrollStudents(
    students: RegisteredUser[],
    courses: Course[],
    perStudent = 2,
) {
    for (const s of students) {
        const selected = [...courses].sort(() => Math.random() - 0.5).slice(0, perStudent);
        for (const c of selected) {
            try {
                await axios.post(
                    `${baseUrl}/enrollments`,
                    { courseId: c.id },
                    { headers: { Authorization: `Bearer ${s.token}` } },
                );
                console.log(`✔ ${s.name} 选课成功：${c.title}`);
            } catch (err: any) {
                const msg = err.response?.data?.error ?? '';
                if (/exist|already|duplicate/i.test(msg)) {
                    console.log(`ℹ ${s.name} 已选过：${c.title}`);
                } else {
                    console.error(`✘ ${s.name} 选课失败：${c.title}`, err.response?.data || err);
                }
            }
        }
    }
}

/**
 * --------------------------------------------------
 * 作业相关
 * --------------------------------------------------
 */
export async function createAssignment(
    adminOrTeacher: Account,
    course: Course,
    title: string,
    description = '',
): Promise<number> {
    const res = await axios.post(
        `${baseUrl}/assignments`,
        { title, description, courseId: course.id },
        { headers: { Authorization: `Bearer ${adminOrTeacher.token}` } },
    );
    const data = res.data.data?.assignment ?? res.data.assignment ?? res.data;
    if (!data?.id) throw new Error('assignment 解析失败');
    return data.id;
}

/**
 * 为每门课程随机布置 1-3 次作业，命名：<课程名> 第 n 次作业
 */
export async function createAssignmentsForCourses(
    admin: Account,
    courses: Course[],
): Promise<Record<number, number[]>> {
    const map: Record<number, number[]> = {};
    for (const course of courses) {
        const times = Math.floor(Math.random() * 3) + 1; // 1-3 次
        map[course.id] = [];
        for (let i = 1; i <= times; i++) {
            const title = `${course.title} 第${i}次作业`;
            try {
                const aid = await createAssignment(admin, course, title, `${title} 描述`);
                map[course.id].push(aid);
                console.log(`✔ 创建作业：${title}`);
            } catch (err) {
                console.error(`✘ 创建作业 ${title} 失败：`, (err as any).response?.data || err);
            }
        }
    }
    return map;
}

export async function submitAssignments(
    assignmentId: number,
    students: RegisteredUser[],
) {
    for (const s of students) {
        try {
            const files = await fs.readdir(s.folderPath);
            const docs = files.filter((f) => f.toLowerCase().endsWith('.docx'));
            if (!docs.length) {
                console.log(`ℹ ${s.name} 无 .docx，跳过`);
                continue;
            }
            const file = docs[Math.floor(Math.random() * docs.length)];
            const buffer = await fs.readFile(path.join(s.folderPath, file));
            const form = new FormData();
            form.append('file', buffer, file);
            await axios.post(`${baseUrl}/assignments/${assignmentId}/submit`, form, {
                headers: { ...form.getHeaders(), Authorization: `Bearer ${s.token}` },
            });
            console.log(`✔ ${s.name} 提交：${file}`);
        } catch (err: any) {
            console.error(`✘ ${s.name} 提交失败：`, err.response?.data || err);
        }
    }
}

/**
 * --------------------------------------------------
 * 主流程
 * --------------------------------------------------
 */
export async function main() {
    const admin = await registerAdmin();
    const teachers = await registerTeachers();
    const students = await registerStudentsFromExp2();

    const courses = await createCourses(admin, teachers);
    await enrollStudents(students, courses, 2);

    const assignmentMap = await createAssignmentsForCourses(admin, courses);

    // 以“操作系统”第二次作业为示例进行文件提交（若存在）
    const osCourse = courses.find((c) => c.title === '操作系统');
    if (osCourse && assignmentMap[osCourse.id]?.length >= 2) {
        await submitAssignments(assignmentMap[osCourse.id][1], students);
    }

    console.log('\n🎉 主流程结束');
}

if (require.main === module) {
    main().catch((e) => {
        console.error('流程异常终止：', e);
        process.exit(1);
    });
}