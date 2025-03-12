// frontend/src/router/index.ts
import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import TeacherDashboard from '@/views/teacher/TeacherDashboard.vue';
import StudentDashboard from '@/views/student/StudentDashboard.vue';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import TeacherCourse from '@/views/teacher/TeacherCourse.vue';
import TeacherCourseDetail from '@/views/teacher/TeacherCourseDetail.vue';
import StudentCourse from '@/views/student/StudentCourse.vue';
import StudentCourseDetail from '@/views/student/StudentCourseDetail.vue';
import Unauthorized from '@/views/Unauthorized.vue';
import store from '@/store';
import CourseManagement from "@/views/admin/CourseManagement.vue";

const routes: Array<RouteRecordRaw> = [
    {path: '/', redirect: '/login'},
    {path: '/login', name: 'Login', component: Login},
    {path: '/register', name: 'Register', component: Register},
    {
        path: '/teacher',
        name: 'TeacherDashboard',
        component: TeacherDashboard,
        meta: {roles: ['teacher']}
    },
    {
        path: '/teacher/courses',
        name: 'TeacherCourse',
        component: TeacherCourse,
        meta: {roles: ['teacher']}
    },
    {
        path: '/teacher/course/:id',
        name: 'TeacherCourseDetail',
        component: TeacherCourseDetail,
        meta: {roles: ['teacher']}
    },
    {
        path: '/student',
        name: 'StudentDashboard',
        component: StudentDashboard,
        meta: {roles: ['student']}
    },
    {
        path: '/student/courses',
        name: 'StudentCourse',
        component: StudentCourse,
        meta: {roles: ['student']}
    },
    {
        path: '/student/course/:id',
        name: 'StudentCourseDetail',
        component: StudentCourseDetail,
        meta: {roles: ['student']}
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {roles: ['admin']}
    },
    {
        path: '/admin/courseManagement',
        name: 'CourseManagement',
        component: CourseManagement,
        meta: {roles: ['admin']}
    },
    {
        path: '/unauthorized',
        name: 'Unauthorized',
        component: Unauthorized
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 全局守卫：检查目标路由 meta.roles 与当前用户角色是否匹配
router.beforeEach((to, from, next) => {
    const currentUser = store.state.currentUser;
    if (to.meta.roles) {
        if (!currentUser || !to.meta.roles.includes(currentUser.role)) {
            return next('/unauthorized');
        }
    }
    next();
});

export default router;