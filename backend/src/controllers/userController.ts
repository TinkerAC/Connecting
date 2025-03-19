// backend/src/controllers/userController.ts
import {NextFunction, Request, RequestHandler, Response} from 'express';
import {User} from '../models';
import bcrypt from 'bcryptjs';
import path from "path";
import Submission from "../models/Submission";
import {sendResponse} from "./authController";

export const getUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const users = await User.findAll({attributes: {exclude: ['password']}});
        res.json(users);
        return;
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({error: '获取用户列表失败'});
        return;
    }
};

export const getUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId, {attributes: {exclude: ['password']}});
        if (!user) {
            res.status(404).json({error: '用户不存在'});
            return;
        }
        res.json(user);
        return;
    } catch (error) {
        console.error('获取用户错误:', error);
        res.status(500).json({error: '获取用户失败'});
        return;
    }
};

export const updateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.params.id;
        const {username, password, role} = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({error: '用户不存在'});
            return;
        }
        if (username) user.username = username;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        if (role) user.role = role;
        await user.save();
        res.json({message: '用户更新成功', user: {id: user.id, username: user.username, role: user.role}});
        return;
    } catch (error) {
        console.error('更新用户错误:', error);
        res.status(500).json({error: '更新用户失败'});
        return;
    }
};

export const deleteUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({error: '用户不存在'});
            return;
        }
        await user.destroy();
        res.json({message: '用户删除成功'});
        return;
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({error: '删除用户失败'});
        return;
    }
};


/**
 * 获取指定作业所有提交记录（教师和管理员）
 * GET /api/assignments/:id/submissions
 */
export const getSubmissions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const assignmentId = req.params.assignmentId;
        // 验证当前用户权限（此处假设 authMiddleware 已经验证过角色）
        const submissions = await Submission.findAll({
            where: {assignmentId: Number(assignmentId)},
        });
        sendResponse(res, 200, true, 'Submissions retrieved successfully.', {submissions});
        return
    } catch (error) {
        console.error('Get submissions error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve submissions.');
        return
    }
};

/**
 * 下载提交文件接口
 * GET /api/submissions/:submissionId/download
 */
export const downloadSubmissionFile: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const submissionId = req.params.submissionId;
        const submission = await Submission.findByPk(submissionId);
        if (!submission) {
            res.status(404).json({error: 'Submission not found.'});
            return
        }
        // 根据保存的文件路径下载文件
        const filePath = path.resolve(submission.filePath);
        res.download(filePath, err => {
            if (err) {
                console.error('Download file error:', err);
                res.status(500).json({error: 'Failed to download file.'});
            }
        });
    } catch (error) {
        console.error('Download submission file error:', error);
        res.status(500).json({error: 'Failed to download file.'});
    }
};