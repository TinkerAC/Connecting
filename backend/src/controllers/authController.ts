// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

/**
 * 定义 API 响应的接口类型
 */
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
}

/**
 * sendResponse - 统一响应函数
 * @param res Express Response 对象
 * @param status HTTP 状态码
 * @param success 请求是否成功
 * @param message 提示信息
 * @param data 返回数据（可选）
 */
const sendResponse = <T = any>(
    res: Response,
    status: number,
    success: boolean,
    message: string,
    data: T | null = null
): Response<ApiResponse<T>> => {
    return res.status(status).json({ success, message, data });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;
        if (role !== 'admin' && role !== 'teacher' && role !== 'student') {
            return sendResponse(res, 400, false, 'Invalid role.');
        }
        if (!username || !password || !role) {
            return sendResponse(res, 400, false, 'Please provide username, password, and role.');
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return sendResponse(res, 400, false, 'Username already exists.');
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ username, password: hashedPassword, role });
        return sendResponse(res, 201, true, 'Registration successful.', { userId: user.id });
    } catch (error) {
        console.error('Registration error:', error);
        return sendResponse(res, 500, false, 'Registration failed.');
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return sendResponse(res, 400, false, 'Please provide username and password.');
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return sendResponse(res, 400, false, 'User does not exist.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, 400, false, 'Incorrect password.');
        }

        // 登录成功后生成 JWT，1 小时后过期
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 返回完整的用户信息：id, username, role 和 token
        return sendResponse(res, 200, true, 'Login successful.', {
            id: user.id,
            username: user.username,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return sendResponse(res, 500, false, 'Login failed.');
    }
};