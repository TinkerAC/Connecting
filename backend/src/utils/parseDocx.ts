import fs from 'fs';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

import { DocxAnalysis } from '../core/Interfaces';
import {extractDocumentStructure} from "../core/analyzer/stucture";
import {extractImagesHash} from "../core/analyzer/image";
import {extractMetadata} from "../core/analyzer/metadata";


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