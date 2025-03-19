// backend/src/controllers/submissionController.ts
import {NextFunction, Request, RequestHandler, Response} from 'express';
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

export const submitAssignment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const assignmentId = req.params.assignmentId;
        const user = (req as any).user; // authMiddleware挂载的用户信息
        const file = (req as any).file;

        if (user.role !== 'student') {
            sendResponse(res, 403, false, 'Only students can submit assignments.');
            return;
        }

        if (!file) {
            sendResponse(res, 400, false, 'No file uploaded.');
            return;
        }
        const newFilePath = file.path;
        const originalFileName = file.originalname; // 获取上传文件的原始文件名

        // 检查是否已有提交记录
        let submission = await Submission.findOne({
            where: {assignmentId: Number(assignmentId), studentId: user.id}
        });

        if (submission) {
            // 如果已有提交记录，则覆盖旧文件（可选择删除旧文件）
            const oldFilePath = submission.filePath;
            // 删除旧文件（如果需要覆盖时删除旧文件，注意检查文件是否存在）
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, err => {
                    if (err) console.error('Error deleting old file:', err);
                });
            }
            submission.filePath = newFilePath;
            submission.originalFileName = originalFileName;
            submission.submittedAt = new Date();
            await submission.save();
            sendResponse(res, 200, true, 'Assignment re-submitted successfully.', {submission});
            return;
        } else {
            // 如果没有提交记录，则创建新的记录
            submission = await Submission.create({
                assignmentId: Number(assignmentId),
                studentId: user.id,
                filePath: newFilePath,
                originalFileName: originalFileName,
            });
            sendResponse(res, 201, true, 'Assignment submitted successfully.', {submission});
            return;
        }
    } catch (error) {
        console.error('Submit assignment error:', error);
        sendResponse(res, 500, false, 'Failed to submit assignment.');
        return;
    }
};