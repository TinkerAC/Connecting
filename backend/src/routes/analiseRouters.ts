// 后端路由（analysisRouter.ts）
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getAnalysisStatus, submitAnalysis } from "../controllers/analysisController";

const router = Router();

// 教师或管理员分析作业任务提交接口, 返回任务 uuid
router.post('/:assignmentId', authMiddleware(['teacher', 'admin']), submitAnalysis);

// 前端轮询查询接口，根据任务 uuid 查询状态
router.get('/:id', authMiddleware(['teacher', 'admin']), getAnalysisStatus);

export default router;