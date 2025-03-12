// backend/src/controllers/enrollmentController.ts
import { Request, Response } from 'express';
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
export const enrollCourse = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'student') {
            return sendResponse(res, 403, false, 'Only students can enroll in courses.');
        }
        const { courseId } = req.body;
        if (!courseId) {
            return sendResponse(res, 400, false, 'courseId is required.');
        }
        const course = await Course.findByPk(courseId);
        if (!course) {
            return sendResponse(res, 404, false, 'Course not found.');
        }
        // 检查是否已报名
        const existing = await CourseEnrollment.findOne({ where: { courseId, studentId: user.id } });
        if (existing) {
            return sendResponse(res, 400, false, 'Already enrolled in this course.');
        }
        const enrollment = await CourseEnrollment.create({ courseId, studentId: user.id });
        return sendResponse(res, 201, true, 'Enrollment successful.', { enrollment });
    } catch (error) {
        console.error('Enroll course error:', error);
        return sendResponse(res, 500, false, 'Failed to enroll in course.');
    }
};

// 获取报名信息：
// - 如果当前用户是 student，则返回该学生的报名记录；
// - 如果是 teacher，则返回自己教授的课程的报名情况；
// - 如果是 admin，则返回所有报名记录。
export const getEnrollments = async (req: Request, res: Response) => {
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
            return sendResponse(res, 403, false, 'Permission denied.');
        }
        return sendResponse(res, 200, true, 'Enrollments retrieved successfully.', { enrollments });
    } catch (error) {
        console.error('Get enrollments error:', error);
        return sendResponse(res, 500, false, 'Failed to get enrollments.');
    }
};

// 移除报名：允许学生自行退选，或 teacher/admin 删除报名记录。
// 这里简单实现：仅允许学生删除自己的报名记录。
export const removeEnrollment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { courseId } = req.body;
        if (!courseId) {
            return sendResponse(res, 400, false, 'courseId is required.');
        }
        const enrollment = await CourseEnrollment.findOne({ where: { courseId, studentId: user.id } });
        if (!enrollment) {
            return sendResponse(res, 404, false, 'Enrollment not found.');
        }
        await enrollment.destroy();
        return sendResponse(res, 200, true, 'Enrollment removed successfully.');
    } catch (error) {
        console.error('Remove enrollment error:', error);
        return sendResponse(res, 500, false, 'Failed to remove enrollment.');
    }
};