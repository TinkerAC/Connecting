/**
 * @file 图像相似度计算工具
 * @description 从 DOCX 的 ZIP 包中提取图片哈希，并通过汉明距离计算两组图片的相似度。
 */
import AdmZip from 'adm-zip';
import crypto from 'crypto';

/**
 * 从 DOCX ZIP 包中提取所有图片文件的 MD5 哈希值列表。
 *
 * @param zip - 已打开的 AdmZip 实例，指向一个 DOCX 文件（本质为 ZIP 格式）。
 * @returns 返回一个字符串数组，每个元素为一个图片文件的 MD5 哈希（hex 格式）。
 */
export function extractImagesHash(zip: AdmZip): string[] {
    // 获取 ZIP 包中所有文件条目
    return zip.getEntries()
        // 只保留在 word/media/ 目录下的非目录（图片）条目
        .filter(e => e.entryName.startsWith('word/media/') && !e.isDirectory)
        // 对每个图片文件，读取其二进制数据并生成 MD5 哈希
        .map(e => {
            const dataBuffer = e.getData();
            // 使用 crypto 模块创建 MD5 哈希，并返回 hex 字符串
            return crypto.createHash('md5')
                .update(dataBuffer)
                .digest('hex');
        });
}

/**
 * 计算两个等长十六进制字符串之间的汉明距离（bit-level）。
 *
 * 通过对每个字符（4-bit）进行异或，然后统计结果中 1 的个数来计算差异位数。
 *
 * @param a - 第一个十六进制字符串
 * @param b - 第二个十六进制字符串
 * @returns 返回两者之间的汉明距离（不同位的数量）。
 */
function hamming(a: string, b: string): number {
    let distance = 0;
    // 假设 a.length === b.length
    for (let i = 0; i < a.length; i++) {
        // 将单个十六进制字符转换为数值（0-15）
        const valA = parseInt(a[i], 16);
        const valB = parseInt(b[i], 16);
        // 异或操作后得到一个 0-15 的结果，转换为二进制并统计 '1' 的数量
        const xorResult = valA ^ valB;
        const bitsDiffer = xorResult.toString(2)
            .replace(/0/g, '')  // 去除 '0'，剩下的全是 '1'
            .length;            // 统计 '1' 的个数
        distance += bitsDiffer;
    }
    return distance;
}

/**
 * 计算两组图片哈希列表之间的相似度得分。
 *
 * 基本思路：
 * 1. 对 A 中每个哈希值，找到 B 中最相近的哈希，计算相似度 1 - (汉明距离 / 总位数)
 * 2. 对 B 中每个哈希值，找到 A 中最相近的哈希，计算相似度
 * 3. 将所有相似度值求平均，作为最终相似度（范围 0-1）。
 *
 * @param A - 第一组图片 MD5 哈希列表
 * @param B - 第二组图片 MD5 哈希列表
 * @returns 返回一个 0 到 1 之间的相似度得分，1 表示完全相同，0 表示完全差异。
 */
export function calculateImageSimilarity(A: string[], B: string[]): number {
    // 如果两组都为空，视为完全相似
    if (!A.length && !B.length) return 1;
    // 如果只有一组为空，视为完全不相似
    if (!A.length || !B.length)  return 0;

    // MD5 哈希长度为 32 字符，每字符代表 4 位，因此总共 128 位
    // 但我们这里字符级汉明距离实际计算的是 4 bit * length, 以字符为单位
    const totalBits = A[0].length * 4;
    const similarities: number[] = [];

    /**
     * 对源数组 src 中的每个哈希，与目标数组 tgt 中所有哈希比对，
     * 取最大相似度值并存入 similarities 数组。
     */
    const computeBestMatches = (src: string[], tgt: string[]) => {
        src.forEach(srcHash => {
            let maxSim = 0;
            tgt.forEach(tgtHash => {
                // 确保两哈希长度一致才可比较
                if (srcHash.length === tgtHash.length) {
                    const dist = hamming(srcHash, tgtHash);
                    // 相似度 = 1 - (汉明距离 / 总位数)
                    const sim = 1 - dist / totalBits;
                    if (sim > maxSim) {
                        maxSim = sim;
                    }
                }
            });
            similarities.push(maxSim);
        });
    };

    // 先计算 A->B 再计算 B->A
    computeBestMatches(A, B);
    computeBestMatches(B, A);

    // 平均所有相似度值，得到综合得分
    const sumSim = similarities.reduce((sum, v) => sum + v, 0);
    return sumSim / similarities.length;
}