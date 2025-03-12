// backend/src/routes/courseRoutes.ts
import { Router } from 'express';
import {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCourseStudents
} from '../controllers/courseController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 创建课程：仅允许 teacher 和 admin
router.post('/', authMiddleware(['admin']), createCourse);

// 获取所有课程：允许所有角色访问
router.get('/', authMiddleware(['student', 'teacher', 'admin']), getCourses);

// 获取课程详情
router.get('/:id', authMiddleware(['student', 'teacher', 'admin']), getCourseById);

// 获取指定课程的学生名单（教师和 admin）
router.get('/:id/students', authMiddleware(['teacher', 'admin']), getCourseStudents);

// 更新课程：仅允许 teacher（自己课程）和 admin
router.put('/:id', authMiddleware(['teacher', 'admin']), updateCourse);

// 删除课程：仅允许 teacher（自己课程）和 admin
router.delete('/:id', authMiddleware(['teacher', 'admin']), deleteCourse);

export default router;