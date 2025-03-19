import {RequestHandler} from 'express';
import {getTaskStatus, submitAnalysisTask} from '../core/analysisQueue';
import {sendResponse} from "./authController";

/**
 * 提交分析任务接口
 * POST /api/analysis
 * 请求体中包含 filePaths 数组
 */
export const submitAnalysis: RequestHandler = async (req, res) => {
    try {
        const {filePaths} = req.body;
        if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
            sendResponse(res, 400, false, 'filePaths must be provided as a non-empty array.');
            return
        }
        const taskId = submitAnalysisTask(filePaths);
        sendResponse(res, 200, true, 'Analysis task submitted successfully.', {taskId});
        return
    } catch (error: any) {
        sendResponse(res, 500, false, error.message);
        return
    }
};

/**
 * 查询任务状态接口
 * GET /api/analysis/:id
 */
export const getAnalysisStatus: RequestHandler = async (req, res) => {
    try {
        const {id} = req.params;
        const task = getTaskStatus(id);
        if (!task) {
            sendResponse(res, 404, false, 'Task not found.');
            return
        }
        sendResponse(res, 200, true, 'Task status retrieved successfully.', task);
        return
    } catch (error: any) {
        sendResponse(res, 500, false, error.message);
        return
    }
};