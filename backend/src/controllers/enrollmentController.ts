// backend/src/controllers/enrollmentController.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { CourseEnrollment, Course } from '../models';

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

// 学生报名课程：仅允许 role 为 'student'
export const enrollCourse: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'student') {
            sendResponse(res, 403, false, 'Only students can enroll in courses.');
            return;
        }
        const { courseId } = req.body;
        if (!courseId) {
            sendResponse(res, 400, false, 'courseId is required.');
            return;
        }
        const course = await Course.findByPk(courseId);
        if (!course) {
            sendResponse(res, 404, false, 'Course not found.');
            return;
        }
        const existing = await CourseEnrollment.findOne({ where: { courseId, studentId: user.id } });
        if (existing) {
            sendResponse(res, 400, false, 'Already enrolled in this course.');
            return;
        }
        const enrollment = await CourseEnrollment.create({ courseId, studentId: user.id });
        sendResponse(res, 201, true, 'Enrollment successful.', { enrollment });
        return;
    } catch (error) {
        console.error('Enroll course error:', error);
        sendResponse(res, 500, false, 'Failed to enroll in course.');
        return;
    }
};

// 获取报名信息：
// - 如果当前用户是 student，则返回该学生的报名记录；
// - 如果是 teacher，则返回自己教授的课程的报名情况；
// - 如果是 admin，则返回所有报名记录。
export const getEnrollments: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        let enrollments;
        if (user.role === 'student') {
            enrollments = await CourseEnrollment.findAll({
                where: { studentId: user.id },
                include: [{ model: Course, as: 'course' }]
            });
        } else if (user.role === 'teacher') {
            enrollments = await CourseEnrollment.findAll({
                include: [{
                    model: Course,
                    as: 'course',
                    where: { teacherId: user.id }
                }]
            });
        } else if (user.role === 'admin') {
            enrollments = await CourseEnrollment.findAll({
                include: [{ model: Course, as: 'course' }]
            });
        } else {
            sendResponse(res, 403, false, 'Permission denied.');
            return;
        }
        sendResponse(res, 200, true, 'Enrollments retrieved successfully.', { enrollments });
        return;
    } catch (error) {
        console.error('Get enrollments error:', error);
        sendResponse(res, 500, false, 'Failed to get enrollments.');
        return;
    }
};

// 移除报名：允许学生自行退选，或 teacher/admin 删除报名记录。
// 这里简单实现：仅允许学生删除自己的报名记录。
export const removeEnrollment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        const { courseId } = req.body;
        if (!courseId) {
            sendResponse(res, 400, false, 'courseId is required.');
            return;
        }
        const enrollment = await CourseEnrollment.findOne({ where: { courseId, studentId: user.id } });
        if (!enrollment) {
            sendResponse(res, 404, false, 'Enrollment not found.');
            return;
        }
        await enrollment.destroy();
        sendResponse(res, 200, true, 'Enrollment removed successfully.');
        return;
    } catch (error) {
        console.error('Remove enrollment error:', error);
        sendResponse(res, 500, false, 'Failed to remove enrollment.');
        return;
    }
};