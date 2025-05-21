import AdmZip from 'adm-zip';
import crypto from 'crypto';

/* 图像哈希提取 */
export function extractImagesHash(zip: AdmZip): string[] {
    return zip.getEntries()
        .filter(e => e.entryName.startsWith('word/media/') && !e.isDirectory)
        .map(e => crypto.createHash('md5').update(e.getData()).digest('hex'));
}

/* 汉明距离 */
function hamming(a: string, b: string) {
    let d = 0;
    for (let i = 0; i < a.length; i++) {
        d += ((parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(2).replace(/0/g, '').length);
    }
    return d;
}

/* 图像相似度 */
export function calculateImageSimilarity(A: string[], B: string[]): number {
    if (!A.length && !B.length) return 1;
    if (!A.length || !B.length)  return 0;

    const bits = 64, sims: number[] = [];

    const best = (src: string[], tgt: string[]) =>
        src.forEach(h => {
            let s = 0;
            tgt.forEach(t => { if (h.length === t.length) s = Math.max(s, 1 - hamming(h, t) / bits); });
            sims.push(s);
        });

    best(A, B); best(B, A);
    return sims.reduce((a, b) => a + b, 0) / sims.length;
}