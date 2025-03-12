// backend/src/controllers/submissionController.ts
import {Request, Response} from 'express';
import fs from 'fs';
import {Submission} from '../models/Submission';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
}

const sendResponse = <T = any>(
    res: Response,
    status: number,
    success: boolean,
    message: string,
    data: T | null = null
): Response<ApiResponse<T>> => {
    return res.status(status).json({success, message, data});
};

export const submitAssignment = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.id;
        const user = (req as any).user; // authMiddleware挂载的用户信息
        const file = (req as any).file;
        if (user.role !== 'student') {
            return sendResponse(res, 403, false, 'Only students can submit assignments.');
        }

        if (!file) {
            return sendResponse(res, 400, false, 'No file uploaded.');
        }
        const newFilePath = file.path;

        // 检查是否已有提交记录
        let submission = await Submission.findOne({
            where: {assignmentId: Number(assignmentId), studentId: user.id}
        });

        if (submission) {
            // 如果已有提交记录，则覆盖：可以选择删除旧文件（如果需要）
            const oldFilePath = submission.filePath;
            // 删除旧文件（如果你希望覆盖时删除旧文件，注意需检查文件是否存在）
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, err => {
                    if (err) console.error('Error deleting old file:', err);
                });
            }
            submission.filePath = newFilePath;
            submission.submittedAt = new Date();
            await submission.save();
            return sendResponse(res, 200, true, 'Assignment re-submitted successfully.', {submission});
        } else {
            // 如果没有提交记录，则创建新的记录
            submission = await Submission.create({
                assignmentId: Number(assignmentId),
                studentId: user.id,
                filePath: newFilePath,
            });
            return sendResponse(res, 201, true, 'Assignment submitted successfully.', {submission});
        }
    } catch (error) {
        console.error('Submit assignment error:', error);
        return sendResponse(res, 500, false, 'Failed to submit assignment.');
    }
};
