import fs from 'fs';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

import { DocxAnalysis } from './types';
import {extractDocumentStructure} from "./stucture";
import {extractImagesHash} from "./image";
import {extractMetadata} from "./metadata";


/* 解析单个 DOCX */
export async function parseDocx(path: string): Promise<DocxAnalysis> {
    const buffer   = fs.readFileSync(path);
    const { value: text } = await mammoth.extractRawText({ buffer });

    const zip       = new AdmZip(buffer);
    const structure = await extractDocumentStructure(zip);
    const images    = extractImagesHash(zip);
    const metadata  = await extractMetadata(zip);

    return { filePath: path, text, images, structure, metadata };
}