import axios from 'axios';

async function testFlow() {
    const baseUrl = 'http://localhost:3000/api';

    // 用于存储注册成功后的用户数据
    const adminAccount: { username: string; id: number; token: string } = {} as any;
    const studentAccounts: Array<{ username: string; id: number; token: string }> = [];
    const teacherAccounts: Array<{ username: string; id: number; token: string }> = [];
    const courses: any[] = [];

    // 1. 注册管理员 a1
    try {
        await axios.post(`${baseUrl}/auth/register`, {
            username: 'a1',
            password: 'a1',
            role: 'admin'
        });
        console.log('Registered admin: a1');

        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            username: 'a1',
            password: 'a1'
        });
        const adminData = loginRes.data.data;
        // 确保返回 id 信息
        adminAccount.username = adminData.username;
        adminAccount.id = adminData.id;
        adminAccount.token = adminData.token;
        console.log('Admin logged in:', adminAccount);
    } catch (err: any) {
        console.error('Error registering/logging admin:', err.response?.data || err);
        return;
    }

    // 2. 注册 10 个学生 (s1～s10)
    for (let i = 1; i <= 10; i++) {
        const username = `s${i}`;
        try {
            // 注册学生
            await axios.post(`${baseUrl}/auth/register`, {
                username,
                password: username,
                role: 'student'
            });
            console.log(`Registered student: ${username}`);

            // 登录获取 token 和 id
            const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                username,
                password: username
            });
            const data = loginRes.data.data;
            studentAccounts.push({
                username,
                id: data.id,
                token: data.token
            });
        } catch (err: any) {
            console.error(`Error registering student ${username}:`, err.response?.data || err);
        }
    }

    // 3. 注册 5 个教师 (t1～t5)
    for (let i = 1; i <= 5; i++) {
        const username = `t${i}`;
        try {
            await axios.post(`${baseUrl}/auth/register`, {
                username,
                password: username,
                role: 'teacher'
            });
            console.log(`Registered teacher: ${username}`);

            const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                username,
                password: username
            });
            const data = loginRes.data.data;
            teacherAccounts.push({
                username,
                id: data.id,
                token: data.token
            });
        } catch (err: any) {
            console.error(`Error registering teacher ${username}:`, err.response?.data || err);
        }
    }

    // 4. 创建 4 门课程，随机绑定一位教师，使用管理员账号创建课程
    const courseNames = ["计算机网络", "数据结构", "计算机组成原理", "操作系统"];
    for (const name of courseNames) {
        // 随机选一位教师
        const randomTeacher = teacherAccounts[Math.floor(Math.random() * teacherAccounts.length)];
        console.log('Selected teacher for course:', randomTeacher);
        try {
            const courseRes = await axios.post(
                `${baseUrl}/courses`,
                {
                    title: name,
                    description: `${name} 描述`,
                    teacherId: randomTeacher.id
                },
                {
                    headers: { Authorization: `Bearer ${adminAccount.token}` }
                }
            );
            console.log(`Course created: ${name} (bound to teacher ${randomTeacher.username})`);
            // 根据后端返回的数据结构
            const course = courseRes.data.data.course || courseRes.data.data;
            courses.push(course);
        } catch (err: any) {
            console.error(`Error creating course ${name}:`, err.response?.data || err);
        }
    }

    // 5. 对于每个学生, 随机报名 2 门不同的课程
    for (const student of studentAccounts) {
        // 随机选取两门不同的课程
        const selectedCourses: any[] = [];
        while (selectedCourses.length < 2 && selectedCourses.length < courses.length) {
            const randomCourse = courses[Math.floor(Math.random() * courses.length)];
            if (!selectedCourses.some(c => c.id === randomCourse.id)) {
                selectedCourses.push(randomCourse);
            }
        }
        for (const course of selectedCourses) {
            try {
                await axios.post(
                    `${baseUrl}/enrollments`,
                    { courseId: course.id },
                    { headers: { Authorization: `Bearer ${student.token}` } }
                );
                console.log(`Student ${student.username} enrolled in course ${course.title}`);
            } catch (err: any) {
                console.error(`Error enrolling student ${student.username} in course ${course.title}:`, err.response?.data || err);
            }
        }
    }

    console.log('Test flow completed');
}

(async () => {
    try {
        // await removeDatabaseFile();
        await testFlow();
    } catch (error) {
        console.error('Test flow failed:', error);
    }
})();


