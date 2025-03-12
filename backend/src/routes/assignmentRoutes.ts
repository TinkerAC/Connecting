// backend/src/routes/assignmentRoutes.ts
import { Router } from 'express';
import {
    createAssignment,
    getAssignments,
    updateAssignment,
    deleteAssignment,
} from '../controllers/assignmentController';
import { submitAssignment } from '../controllers/submissionController';
import { authMiddleware } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// 创建作业（基于课程）
router.post('/', authMiddleware(['teacher', 'admin']), createAssignment);

// 查询作业列表（支持按 courseId 过滤）
router.get('/', authMiddleware(['student', 'teacher', 'admin']), getAssignments);

// 更新作业
router.put('/:id', authMiddleware(['teacher', 'admin']), updateAssignment);

// 删除作业
router.delete('/:id', authMiddleware(['teacher', 'admin']), deleteAssignment);

// 提交作业：仅允许学生提交作业，允许上传覆盖（文件上传字段名为 file）
router.post('/:id/submit', authMiddleware(['student']), upload.single('file'), submitAssignment);

export default router;