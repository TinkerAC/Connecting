// backend/src/controllers/assignmentController.ts
import {NextFunction, Request, RequestHandler, Response} from 'express';
import {Assignment, Course} from '../models';
import Submission from "../models/Submission";
import {sendResponse} from "./authController";

/**
 * 创建作业（仅教师能创建作业，或管理员操作）
 * 现在需要传入 courseId 表示该作业所属课程
 */
export const createAssignment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {title, description, courseId} = req.body;
        if (!title || !description || !courseId) {
            res.status(400).json({error: '请提供作业标题、描述以及课程ID'});
            return;
        }

        // 验证课程是否存在
        const course = await Course.findByPk(courseId);
        if (!course) {
            res.status(400).json({error: '无效的课程ID'});
            return;
        }

        // 验证当前用户身份
        const user = (req as any).user;
        // 如果当前用户是教师，则只能在自己教授的课程中创建作业
        if (user.role === 'teacher' && course.teacherId !== user.id) {
            res.status(403).json({error: '您无权在该课程中发布作业'});
            return;
        }

        // 创建作业时，将 courseId 保存到 Assignment 中
        const assignment = await Assignment.create({title, description, courseId});
        res.status(201).json({message: '作业创建成功', assignment});
        return;
    } catch (error) {
        console.error('创建作业错误:', error);
        res.status(500).json({error: '创建作业失败'});
        return;
    }
};


/**
 * 获取指定课程下的作业列表，并根据当前用户角色附加提交状态信息
 * URL 参数中应包含 courseId
 */
export const getAssignments: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const courseIdParam = req.params.id;
        const courseId = Number(courseIdParam);
        if (isNaN(courseId)) {
            sendResponse(res, 400, false, 'Invalid courseId');
            return
        }

        // 查询指定课程的作业
        let assignments = await Assignment.findAll({where: {courseId}});

        // 获取当前用户信息（由 authMiddleware 挂载）
        const user = (req as any).user;
        if (user) {
            if (user.role === 'student') {
                // 对于学生，检查该学生是否已提交作业
                assignments = await Promise.all(assignments.map(async (assignment: any) => {
                    try {
                        const submission = await Submission.findOne({
                            where: {assignmentId: assignment.id, studentId: user.id}
                        });
                        assignment.setDataValue('submitted', !!submission);
                    } catch (e) {
                        assignment.setDataValue('submitted', false);
                    }
                    return assignment;
                }));
            } else if (user.role === 'teacher' || user.role === 'admin') {
                // 对于教师或管理员，统计提交数量
                assignments = await Promise.all(assignments.map(async (assignment: any) => {
                    try {
                        const submissions = await Submission.findAll({
                            where: {assignmentId: assignment.id}
                        });
                        assignment.setDataValue('submissionCount', submissions.length);
                    } catch (e) {
                        assignment.setDataValue('submissionCount', 0);
                    }
                    return assignment;
                }));
            }
        }
        sendResponse(res, 200, true, 'Assignments retrieved successfully.', {assignments});
        return
    } catch (error) {
        console.error('Get assignments error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve assignments.');
        return
    }
};
/**
 * 更新作业信息
 */
export const updateAssignment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const assignmentId = req.params.assignmentId;
        const {title, description} = req.body;
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            res.status(404).json({error: '作业不存在'});
            return;
        }

        assignment.title = title || assignment.title;
        assignment.description = description || assignment.description;
        await assignment.save();

        res.json({message: '作业更新成功', assignment});
        return;
    } catch (error) {
        console.error('更新作业错误:', error);
        res.status(500).json({error: '更新作业失败'});
        return;
    }
};

/**
 * 删除作业
 */
export const deleteAssignment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const assignmentId = req.params.assignmentId;
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            res.status(404).json({error: '作业不存在'});
            return;
        }
        await assignment.destroy();
        res.json({message: '作业删除成功'});
        return;
    } catch (error) {
        console.error('删除作业错误:', error);
        res.status(500).json({error: '删除作业失败'});
        return;
    }
};


export const getAssignmentById: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const assignmentId = req.params.assignmentId;
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            res.status(404).json({error: '作业不存在'});
            return;
        }
        res.json({message: '获取作业成功', assignment});
        return;
    } catch (error) {
        console.error('获取作业错误:', error);
        res.status(500).json({error: '获取作业失败'});
        return;
    }
}



