// backend/src/controllers/courseController.ts
import { Request, Response } from 'express';
import { Course } from '../models';

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
    return res.status(status).json({ success, message, data });
};

// 创建课程：仅允许 teacher 或 admin 操作。
// 如果当前用户是 teacher，则自动设置 teacherId 为 token 中的 id；admin 则需在请求中提供 teacherId。
export const createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user; // 从 authMiddleware 中设置
        let teacherId: number;
        if (user.role === 'teacher') {
            teacherId = user.id;
        } else if (user.role === 'admin') {
            teacherId = req.body.teacherId;
            if (!teacherId) {
                sendResponse(res, 400, false, 'teacherId is required for admin.');
                return;
            }
        } else {
            sendResponse(res, 403, false, 'Permission denied.');
            return;
        }
        const { title, description } = req.body;
        if (!title) {
            sendResponse(res, 400, false, 'Title is required.');
            return;
        }
        const course = await Course.create({ title, description, teacherId });
        sendResponse(res, 201, true, 'Course created successfully.', { course });
        return;
    } catch (error) {
        console.error('Create course error:', error);
        sendResponse(res, 500, false, 'Failed to create course.');
        return;
    }
};

export const getCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user; // 从 authMiddleware 中获取当前用户信息
        let courses;
        if (user.role === 'teacher') {
            // 仅返回当前教师教授的课程
            courses = await Course.findAll({ where: { teacherId: user.id } });
        } else if (user.role === 'student') {
            // 通过关联方法返回学生已报名的课程
            courses = await (req as any).user.getEnrolledCourses();
        } else if (user.role === 'admin') {
            // 管理员返回所有课程
            courses = await Course.findAll();
        } else {
            sendResponse(res, 403, false, 'Permission denied.');
            return;
        }
        sendResponse(res, 200, true, 'Courses retrieved successfully.', { courses });
        return;
    } catch (error) {
        console.error('Get courses error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve courses.');
        return;
    }
};

export const getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            sendResponse(res, 404, false, 'Course not found.');
            return;
        }
        sendResponse(res, 200, true, 'Course retrieved successfully.', { course });
        return;
    } catch (error) {
        console.error('Get course by id error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve course.');
        return;
    }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            sendResponse(res, 404, false, 'Course not found.');
            return;
        }
        const user = (req as any).user;
        if (user.role === 'teacher' && course.teacherId !== user.id) {
            sendResponse(res, 403, false, 'You can only update your own courses.');
            return;
        }
        const { title, description } = req.body;
        course.title = title || course.title;
        course.description = description || course.description;
        await course.save();
        sendResponse(res, 200, true, 'Course updated successfully.', { course });
        return;
    } catch (error) {
        console.error('Update course error:', error);
        sendResponse(res, 500, false, 'Failed to update course.');
        return;
    }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            sendResponse(res, 404, false, 'Course not found.');
            return;
        }
        const user = (req as any).user;
        if (user.role === 'teacher' && course.teacherId !== user.id) {
            sendResponse(res, 403, false, 'You can only delete your own courses.');
            return;
        }
        await course.destroy();
        sendResponse(res, 200, true, 'Course deleted successfully.');
        return;
    } catch (error) {
        console.error('Delete course error:', error);
        sendResponse(res, 500, false, 'Failed to delete course.');
        return;
    }
};

export const getCourseStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.id;
        const course = await Course.findByPk(courseId);
        if (!course) {
            sendResponse(res, 404, false, 'Course not found.');
            return;
        }
        const user = (req as any).user;
        if (user.role === 'teacher' && course.teacherId !== user.id) {
            sendResponse(
                res,
                403,
                false,
                'You can only view students of your own courses. Your id is ' +
                user.id +
                ' and course.teacherId is ' +
                course.teacherId +
                ' your role is ' +
                user.role
            );
            return;
        }
        // 假设 Course 模型关联了 getStudents 方法
        const students = await (course as any).getStudents();
        sendResponse(res, 200, true, 'Students retrieved successfully.', { students });
        return;
    } catch (error) {
        console.error('Get course students error:', error);
        sendResponse(res, 500, false, 'Failed to retrieve students.');
        return;
    }
};