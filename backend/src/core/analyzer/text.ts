
/**
 * 文本相似度计算工具
 * -----------------------------------
 * - getWordFreq(txt): 统计文本中各词出现频率，输出词频字典。
 * - calculateTextSimilarity(a, b): 基于余弦相似度比较两段文本的词频向量，返回 0-1 之间的相似度得分。
 */

/**
 * 计算文本中各词的出现频率。
 *
 * @param txt - 待处理的原始文本字符串
 * @returns 词频字典，键为单词（小写），值为出现次数
 */
export function getWordFreq(txt: string): Record<string, number> {
    // 将文本统一转为小写，并用正则匹配所有单词（字母/数字/下划线）
    const words = txt.toLowerCase().match(/\w+/g) || [];
    const freq: Record<string, number> = {};

    // 遍历每个匹配到的单词，累加出现次数
    words.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });

    return freq;
}

/**
 * 计算两段文本的相似度，使用余弦相似度衡量它们的词频向量之间的夹角。
 *
 * 步骤：
 * 1. 分别获取两段文本的词频字典。
 * 2. 构建包含所有出现词汇的集合（并集）。
 * 3. 计算词频向量的点积（dot）和各自的平方和（normA, normB）。
 * 4. 相似度 = dot / (sqrt(normA) * sqrt(normB))。
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns 余弦相似度数值，范围 [0, 1]；若任一文本无词，则返回 0。
 */
export function calculateTextSimilarity(a: string, b: string): number {
    // 获取词频字典
    const fa = getWordFreq(a);
    const fb = getWordFreq(b);

    // 构建两文本词汇并集，用于向量维度遍历
    const vocab = new Set([...Object.keys(fa), ...Object.keys(fb)]);

    // 初始化点积和各向量的平方和
    let dot = 0;
    let normA = 0;
    let normB = 0;

    // 遍历所有词汇，累加计算
    vocab.forEach(word => {
        const x = fa[word] || 0; // 文本 A 中该词频率
        const y = fb[word] || 0; // 文本 B 中该词频率
        dot += x * y;
        normA += x * x;
        normB += y * y;
    });

    // 若任一文本向量范数为零，返回 0（无可比词汇）
    if (!normA || !normB) {
        return 0;
    }

    // 计算并返回余弦相似度
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}