// backend/src/routes/assignmentRoutes.ts
import {Router} from 'express';
import {
    createAssignment,
    deleteAssignment,
    getAssignmentById,
    updateAssignment,
} from '../controllers/assignmentController';
import {submitAssignment} from '../controllers/submissionController';
import {authMiddleware} from '../middleware/auth';
import upload from '../middleware/upload';
import {downloadSubmissionFile, getSubmissions} from "../controllers/userController";
import {submitAnalysis} from "../controllers/analysisController";


const router = Router();

// 创建作业：允许 teacher 和 admin 使用
router.post('/', authMiddleware(['teacher', 'admin']), createAssignment);

// 更新作业：允许 teacher 和 admin 使用
router.put('/:assignmentId', authMiddleware(['teacher', 'admin']), updateAssignment);
//查询作业：允许 teacher 和 admin 使用
router.get('/:assignmentId', authMiddleware(['teacher', 'admin']), getAssignmentById);

// 删除作业：允许 teacher 和 admin 使用
router.delete('/:assignmentId', authMiddleware(['teacher', 'admin']), deleteAssignment);

// 提交作业：仅允许 student 使用，使用 multer 处理文件上传（字段名为 file）
router.post('/:assignmentId/submit', authMiddleware(['student']), upload.single('file'), submitAssignment);

// 仅允许 teacher 和 admin 查询该作业的所有提交记录
router.get('/:assignmentId/submissions', authMiddleware(['teacher', 'admin']), getSubmissions);

// 文件下载接口
router.get('/:submissionId/download', authMiddleware(['teacher', 'admin']), downloadSubmissionFile);




export default router;