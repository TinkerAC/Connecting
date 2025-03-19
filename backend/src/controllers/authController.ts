// backend/src/controllers/authController.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
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
export const sendResponse = <T = any>(
    res: Response,
    status: number,
    success: boolean,
    message: string,
    data: T | null = null
): Response<any> => {
    return res.status(status).json({ success, message, data });
};

/**
 * register - 用户注册控制器
 */
export const register: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password, role } = req.body;
        if (role !== 'admin' && role !== 'teacher' && role !== 'student') {
            sendResponse(res, 400, false, 'Invalid role.');
            return;
        }
        if (!username || !password || !role) {
            sendResponse(res, 400, false, 'Please provide username, password, and role.');
            return;
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            sendResponse(res, 400, false, 'Username already exists.');
            return;
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ username, password: hashedPassword, role });
        sendResponse(res, 201, true, 'Registration successful.', { userId: user.id });
        return;
    } catch (error) {
        console.error('Registration error:', error);
        sendResponse(res, 500, false, 'Registration failed.');
        return;
    }
};

/**
 * login - 用户登录控制器
 */
export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            sendResponse(res, 400, false, 'Please provide username and password.');
            return;
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            sendResponse(res, 400, false, 'User does not exist.');
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            sendResponse(res, 400, false, 'Incorrect password.');
            return;
        }

        // 登录成功后生成 JWT，1 小时后过期
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        sendResponse(res, 200, true, 'Login successful.', {
            id: user.id,
            username: user.username,
            role: user.role,
            token,
        });
        return;
    } catch (error) {
        console.error('Login error:', error);
        sendResponse(res, 500, false, 'Login failed.');
        return;
    }
};