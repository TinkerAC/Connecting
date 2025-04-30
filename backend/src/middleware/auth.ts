// backend/src/middleware/auth.ts
import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

/**
 * authMiddleware：返回一个中间件函数，只有当 token 中解析的角色在 allowedRoles 内时才允许访问
 * @param allowedRoles 允许访问的角色列表
 */
export const authMiddleware = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({error: 'No token provided'});
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({error: 'No token provided'});
            return;
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (!allowedRoles.includes(decoded.role)) {
                res.status(403).json({error: 'Permission denied'});
                return;
            }
            (req as any).user = decoded;
            next();
        } catch (error) {
            res.status(401).json({error: 'Invalid token'});
            return;
        }
    };
};