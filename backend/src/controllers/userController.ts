// backend/src/controllers/userController.ts
import {Request, Response} from 'express';
import {User} from '../models';
import bcrypt from 'bcryptjs';

/**
 * 获取所有用户列表（排除密码字段）
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({attributes: {exclude: ['password']}});
        res.json(users);
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({error: '获取用户列表失败'});
    }
};

/**
 * 获取单个用户（排除密码字段）
 */
export const getUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId, {attributes: {exclude: ['password']}});
        if (!user) {
            return res.status(404).json({error: '用户不存在'});
        }
        res.json(user);
    } catch (error) {
        console.error('获取用户错误:', error);
        res.status(500).json({error: '获取用户失败'});
    }
};

/**
 * 更新用户信息（支持更新用户名、密码和角色）
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const {username, password, role} = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({error: '用户不存在'});
        }
        if (username) user.username = username;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        if (role) user.role = role;
        await user.save();
        res.json({message: '用户更新成功', user: {id: user.id, username: user.username, role: user.role}});
    } catch (error) {
        console.error('更新用户错误:', error);
        res.status(500).json({error: '更新用户失败'});
    }
};

/**
 * 删除用户
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({error: '用户不存在'});
        }
        await user.destroy();
        res.json({message: '用户删除成功'});
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({error: '删除用户失败'});
    }
};