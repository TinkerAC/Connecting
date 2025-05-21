import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

/* 结构提取 */
export async function extractDocumentStructure(zip: AdmZip): Promise<string[]> {
    const entry = zip.getEntry('word/document.xml');
    if (!entry) return [];
    const xml = entry.getData().toString('utf-8');
    const doc = await parseStringPromise(xml);
    const ps  = doc['w:document']?.['w:body']?.[0]?.['w:p'] || [];

    const titles: string[] = [];
    ps.forEach((p: any) => {
        const style = p['w:pPr']?.[0]?.['w:pStyle']?.[0]?.['$']?.['w:val'];
        if (style && /^Heading/i.test(style)) {
            const text = (p['w:r'] || []).map((r: any) => (r['w:t'] || []).join('')).join(' ');
            titles.push(text.trim());
        }
    });
    return titles;
}

/* 结构相似度 */
export function calculateStructureSimilarity(A: string[], B: string[]) {
    const SA = new Set(A), SB = new Set(B);
    const inter = [...SA].filter(x => SB.has(x)).length;
    const uni   = new Set([...SA, ...SB]).size;
    return uni ? inter / uni : 1;
}