import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';

const assignmentsDir = path.join(__dirname, '../../uploads/assignments');

// 确保目标目录存在
if (!fs.existsSync(assignmentsDir)) {
    fs.mkdirSync(assignmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (
        req: Request,
        file: any,
        cb: (error: Error | null, destination: string) => void
    ) => {
        // 这里也可以每次检查是否存在，如果需要的话
        cb(null, assignmentsDir);
    },
    filename: (
        req: Request,
        file: any,
        cb: (error: Error | null, filename: string) => void
    ) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (
    req: Request,
    file: any,
    cb: multer.FileFilterCallback
): void => {
    if (/\.docx?$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only DOC/DOCX files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });

export default upload;