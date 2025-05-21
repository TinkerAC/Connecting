import {Router} from 'express';
import {
    createCourse,
    deleteCourse,
    getCourseById,
    getCourses,
    getCourseStudents,
    updateCourse
} from '../controllers/courseController';
import {authMiddleware} from '../middleware/auth';
import {getAssignments} from '../controllers/assignmentController';

const router = Router();

// 创建课程：仅允许 admin 创建
router.post('/', authMiddleware(['admin']), createCourse);

// 获取所有课程：允许所有角色访问
router.get('/', authMiddleware(['student', 'teacher', 'admin']), getCourses);

// 获取课程详情
router.get('/:id', authMiddleware(['student', 'teacher', 'admin']), getCourseById);

// 获取指定课程下的作业列表：courseId 直接嵌入 URL
router.get('/:id/assignments', authMiddleware(['student', 'teacher', 'admin']), getAssignments);

// 获取指定课程的学生名单（教师和 admin）
router.get('/:id/students', authMiddleware(['teacher', 'admin']), getCourseStudents);

// 更新课程：允许 teacher（自己课程）和 admin
router.put('/:id', authMiddleware(['teacher', 'admin']), updateCourse);

// 删除课程：允许 teacher（自己课程）和 admin
router.delete('/:id', authMiddleware(['teacher', 'admin']), deleteCourse);

export default router;