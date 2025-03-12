// backend/src/controllers/assignmentController.ts
import { Request, Response } from 'express';
import { Assignment, Course } from '../models';

/**
 * 创建作业（仅教师能创建作业，或管理员操作）
 * 现在需要传入 courseId 表示该作业所属课程
 */
export const createAssignment = async (req: Request, res: Response) => {
    try {
        const { title, description, courseId } = req.body;
        if (!title || !description || !courseId) {
            return res.status(400).json({ error: '请提供作业标题、描述以及课程ID' });
        }

        // 验证课程是否存在
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(400).json({ error: '无效的课程ID' });
        }

        // 验证当前用户身份
        const user = (req as any).user;
        // 如果当前用户是教师，则只能在自己教授的课程中创建作业
        if (user.role === 'teacher' && course.teacherId !== user.id) {
            return res.status(403).json({ error: '您无权在该课程中发布作业' });
        }

        // 创建作业时，将 courseId 保存到 Assignment 中
        const assignment = await Assignment.create({ title, description, courseId });
        res.status(201).json({ message: '作业创建成功', assignment });
    } catch (error) {
        console.error('创建作业错误:', error);
        res.status(500).json({ error: '创建作业失败' });
    }
};

/**
 * 查询作业列表（可选按课程ID过滤）
 */
export const getAssignments = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        let assignments;
        if (courseId) {
            assignments = await Assignment.findAll({ where: { courseId } });
        } else {
            assignments = await Assignment.findAll();
        }
        res.json(assignments);
    } catch (error) {
        console.error('获取作业错误:', error);
        res.status(500).json({ error: '获取作业失败' });
    }
};

/**
 * 更新作业信息
 */
export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.id;
        const { title, description } = req.body;
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: '作业不存在' });
        }

        assignment.title = title || assignment.title;
        assignment.description = description || assignment.description;
        await assignment.save();

        res.json({ message: '作业更新成功', assignment });
    } catch (error) {
        console.error('更新作业错误:', error);
        res.status(500).json({ error: '更新作业失败' });
    }
};

/**
 * 删除作业
 */
export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.id;
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: '作业不存在' });
        }
        await assignment.destroy();
        res.json({ message: '作业删除成功' });
    } catch (error) {
        console.error('删除作业错误:', error);
        res.status(500).json({ error: '删除作业失败' });
    }
};