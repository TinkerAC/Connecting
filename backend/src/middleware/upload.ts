// backend/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/assignments'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        // 使用时间戳和随机字符串生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 只允许 doc 或 docx 格式，检查文件扩展名（可扩展为 MIME 类型检查）
    if (/\.docx?$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only DOC/DOCX files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });

export default upload;