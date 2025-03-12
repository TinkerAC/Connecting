// backend/src/routes/enrollmentRoutes.ts
import { Router } from 'express';
import { enrollCourse, getEnrollments, removeEnrollment } from '../controllers/enrollmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 报名课程：仅允许学生报名
router.post('/', authMiddleware(['student']), enrollCourse);

// 获取报名信息：允许 student、teacher 和 admin 访问（逻辑由控制器区分）
router.get('/', authMiddleware(['student', 'teacher', 'admin']), getEnrollments);

// 退选/移除报名：这里简化为仅允许学生操作
router.delete('/', authMiddleware(['student']), removeEnrollment);

export default router;