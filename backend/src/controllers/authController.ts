// backend/src/controllers/authController.ts
import {NextFunction, Request, RequestHandler, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from "@bsrc/models";
import {config} from "@bsrc/utils/loadConfig";

const JWT_SECRET = config.jwt_secret


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
    return res.status(status).json({success, message, data});
};

/**
 * register - 用户注册控制器
 */
export const register: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {name, email, password, role} = req.body;
        // 验证必填字段
        if (!name || !email || !password || !role) {
            sendResponse(res, 400, false, '请提供姓名、邮箱、密码和角色。');
            return;
        }
        // 检查角色是否有效
        if (role !== 'admin' && role !== 'teacher' && role !== 'student') {
            sendResponse(res, 400, false, '无效的角色。');
            return;
        }

        // 检查邮箱是否已存在
        const existingUser = await User.findOne({where: {email}});
        if (existingUser) {
            sendResponse(res, 400, false, '邮箱已被注册。');
            return;
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建用户
        const user = await User.create({name, email, password: hashedPassword, role});
        sendResponse(res, 201, true, '注册成功。', {userId: user.id});
        return;
    } catch (error) {
        console.error('注册错误:', error);
        sendResponse(res, 500, false, '注册失败。');
        return;
    }
};

/**
 * login - 用户登录控制器
 */
export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            sendResponse(res, 400, false, '请提供邮箱和密码。');
            return;
        }

        const user = await User.findOne({where: {email}});
        if (!user) {
            sendResponse(res, 400, false, '用户不存在。');
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            sendResponse(res, 400, false, '密码错误。');
            return;
        }

        // 登录成功后生成 JWT，1 小时后过期
        const token = jwt.sign(
            {id: user.id, name: user.name, email: user.email, role: user.role},
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        sendResponse(res, 200, true, '登录成功。', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
        return;
    } catch (error) {
        console.error('登录错误:', error);
        sendResponse(res, 500, false, '登录失败。');
        return;
    }
};