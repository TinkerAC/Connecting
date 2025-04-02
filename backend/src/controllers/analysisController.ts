import {RequestHandler} from 'express';
import {getTaskStatus, submitAnalysisTask} from '../core/analysisQueue';
import {sendResponse} from "./authController";
import Submission from "../models/Submission";
import {User} from "../models";


/**
 * 提交分析任务接口
 * POST /api/analysis/:assignmentId
 * 根据作业 ID 查询所有提交记录，同时获取提交者的用户信息
 */
export const submitAnalysis: RequestHandler = async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        // 联表查询提交记录及对应的学生信息（别名为 student）
        const submissions = await Submission.findAll({
            where: {assignmentId},
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'name']
            }]
        });
        // 将每个提交记录组装为包含文件路径和用户信息的数据结构
        const submissionInfos = submissions.map((submission: any) => ({
            filePath: submission.filePath,
            studentId: submission.studentId,
            studentName: submission.student ? submission.student.name : 'Unknown'
        }));

        // 将 submissionInfos 传递给分析任务处理函数（需修改 analyzeDocxFiles 函数以接收此结构）
        const taskId = await submitAnalysisTask(submissionInfos);
        sendResponse(res, 200, true, 'Analysis task submitted successfully.', {taskId});
        return;
    } catch (error: any) {
        sendResponse(res, 500, false, error.message);
        return;
    }
};


/**
 * 查询任务状态接口
 * GET /api/analysis/
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