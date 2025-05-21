// backend/src/routes/userRoutes.ts
import {Router} from 'express';
import {deleteUser, getUser, getUsers, updateUser} from '../controllers/userController';
import {authMiddleware} from '../middleware/auth';

const router = Router();

// 获取所有用户：仅允许 admin
router.get('/', authMiddleware(['admin']), getUsers);

// 获取单个用户：仅允许 admin
router.get('/:id', authMiddleware(['admin']), getUser);

// 更新用户：仅允许 admin
router.put('/:id', authMiddleware(['admin']), updateUser);

// 删除用户：仅允许 admin
router.delete('/:id', authMiddleware(['admin']), deleteUser);

export default router;