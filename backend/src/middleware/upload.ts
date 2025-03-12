import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';

const storage = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ) => {
        cb(null, path.join(__dirname, '../../uploads/assignments'));
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
    ) => {
        const ext = path.extname(file.originalname);
        // 生成唯一文件名：时间戳+随机字符串+原文件扩展名
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    // 只允许 doc 或 docx 格式，检查文件扩展名（也可扩展为 MIME 类型检查）
    if (/\.docx?$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only DOC/DOCX files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });

export default upload;