import fs from 'fs';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import {parseStringPromise} from 'xml2js';
import crypto from 'crypto';

/** 定义单个 DOCX 文件分析后的数据结构 */
export interface DocxAnalysis {
    filePath: string;
    text: string;
    images: string[];
    structure: string[];
    metadata: {
        author?: string;
        modifiedDate?: Date;
        [key: string]: any;
    };
}

/** 定义两两比较的结果 */
export interface PairwiseComparison {
    fileA: string;
    fileB: string;
    textSimilarity: number;
    imageSimilarity: number;
    structureSimilarity: number;
    metadataSimilarity: number;
    overallSimilarity: number;
}

/** 定义总体分析结果 */
export interface AnalysisResult {
    comparisons: PairwiseComparison[];
    plagiarismNetwork: { source: string; target: string; similarity: number }[];
}


/**
 * 解析单个 docx 文件，提取文本、图像、结构和元数据
 * @param filePath 文件路径
 * @returns 返回 DocxAnalysis 对象
 */
export async function parseDocx(filePath: string): Promise<DocxAnalysis> {
    try {
        // 读取文件缓冲区
        const buffer = fs.readFileSync(filePath);
        // 提取文档文本
        const mammothResult = await mammoth.extractRawText({buffer});
        const text = mammothResult.value;
        // 使用 AdmZip 解析 DOCX 压缩包
        const zip = new AdmZip(buffer);
        // 提取文档结构（例如标题）
        const structure = await extractDocumentStructure(zip);
        // 提取图像哈希值，用于比对图像相似性
        const images = extractImagesHash(zip);
        // 提取元数据（如作者、修改时间等）
        const metadata = await extractMetadata(zip);
        return {filePath, text, images, structure, metadata};
    } catch (err) {
        console.error(`解析文件 ${filePath} 时发生错误:`, err);
        throw err;
    }
}

/**
 * 从 docx 的 document.xml 中提取文档结构（例如标题）
 * @param zip AdmZip 对象
 * @returns 返回标题数组
 */
async function extractDocumentStructure(zip: AdmZip): Promise<string[]> {
    const entry = zip.getEntry("word/document.xml");
    if (!entry) return [];
    const xmlContent = entry.getData().toString("utf-8");
    try {
        const parsed = await parseStringPromise(xmlContent);
        const body = parsed["w:document"]?.["w:body"];
        if (!body || !Array.isArray(body)) return [];
        const paragraphs = body[0]["w:p"];
        const structureItems: string[] = [];
        if (Array.isArray(paragraphs)) {
            paragraphs.forEach((p: any) => {
                const pPr = p["w:pPr"] && p["w:pPr"][0];
                const pStyle = pPr && pPr["w:pStyle"] && pPr["w:pStyle"][0]?.["$"]?.["w:val"];
                // 判断样式是否为标题（如 Heading1, Heading2 等）
                if (pStyle && /^Heading/i.test(pStyle)) {
                    const texts = extractTextFromParagraph(p);
                    structureItems.push(texts.trim());
                }
            });
        }
        return structureItems;
    } catch (err) {
        console.error("解析 document.xml 时出错:", err);
        return [];
    }
}

/**
 * 从段落中提取文本
 * @param paragraph 段落对象
 * @returns 返回段落文本内容
 */
function extractTextFromParagraph(paragraph: any): string {
    let result = "";
    if (paragraph["w:r"]) {
        paragraph["w:r"].forEach((run: any) => {
            if (run["w:t"]) {
                result += run["w:t"].join("") + " ";
            }
        });
    }
    return result;
}

/**
 * 提取 docx 文件中所有图像的哈希值
 * @param zip AdmZip 对象
 * @returns 返回图像哈希数组
 */
function extractImagesHash(zip: AdmZip): string[] {
    const images: string[] = [];
    const entries = zip.getEntries();
    entries.forEach((entry) => {
        if (entry.entryName.startsWith("word/media/") && !entry.isDirectory) {
            const fileBuffer = entry.getData();
            const hash = crypto.createHash("md5").update(fileBuffer).digest("hex");
            images.push(hash);
        }
    });
    return images;
}

/**
 * 提取 docx 文件的元数据
 * @param zip AdmZip 对象
 * @returns 返回包含元数据的对象
 */
async function extractMetadata(zip: AdmZip): Promise<{ [key: string]: any }> {
    const entry = zip.getEntry("docProps/core.xml");
    if (!entry) return {};
    const xmlContent = entry.getData().toString("utf-8");
    try {
        const parsed = await parseStringPromise(xmlContent);
        const coreProps = parsed["cp:coreProperties"] || {};
        const author = coreProps["dc:creator"] ? coreProps["dc:creator"][0] : undefined;
        const modifiedStr = coreProps["dcterms:modified"] ? coreProps["dcterms:modified"][0] : undefined;
        const modifiedDate = modifiedStr ? new Date(modifiedStr) : undefined;
        return {author, modifiedDate};
    } catch (err) {
        console.error("解析 core.xml 时出错:", err);
        return {};
    }
}

/**
 * 计算两个文本之间的相似度（余弦相似度）
 * @param textA 文本A
 * @param textB 文本B
 * @returns 返回相似度（0~1）
 */
function calculateTextSimilarity(textA: string, textB: string): number {
    const freqA = getWordFrequency(textA);
    const freqB = getWordFrequency(textB);
    const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    allWords.forEach(word => {
        const a = freqA[word] || 0;
        const b = freqB[word] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    });
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 统计文本中每个单词的出现频率
 * @param text 输入文本
 * @returns 返回单词频率对象
 */
function getWordFrequency(text: string): { [word: string]: number } {
    const freq: { [word: string]: number } = {};
    const words = text.toLowerCase().match(/\w+/g) || [];
    words.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
}

/**
 * 计算两个十六进制哈希字符串的汉明距离
 * @param hash1 哈希字符串1
 * @param hash2 哈希字符串2
 * @returns 返回汉明距离
 */
function hammingDistance(hash1: string, hash2: string): number {
    let distance = 0;
    // 确保两个哈希长度一致
    for (let i = 0; i < hash1.length; i++) {
        const digit1 = parseInt(hash1[i], 16);
        const digit2 = parseInt(hash2[i], 16);
        const diff = digit1 ^ digit2;
        // 计算 diff 中二进制中1的个数
        distance += diff.toString(2).split('0').join('').length;
    }
    return distance;
}

/**
 * 计算图像相似度：基于哈希的汉明距离进行比对
 * 对于每个图像哈希，在另一文件中找到最相似的哈希，然后取平均相似度
 * @param imagesA 图像哈希数组A
 * @param imagesB 图像哈希数组B
 * @returns 返回相似度（0~1）
 */
function calculateImageSimilarity(imagesA: string[], imagesB: string[]): number {
    if (imagesA.length === 0 && imagesB.length === 0) return 1;
    if (imagesA.length === 0 || imagesB.length === 0) return 0;
    const maxDistance = 64; // 假设使用 64 位 pHash

    // 对于 imagesA 中的每个哈希，找到 imagesB 中最相似的哈希
    const simA = imagesA.map(hashA => {
        let bestSim = 0;
        for (const hashB of imagesB) {
            if (hashA.length === hashB.length) {
                const distance = hammingDistance(hashA, hashB);
                const sim = 1 - (distance / maxDistance);
                if (sim > bestSim) bestSim = sim;
            }
        }
        return bestSim;
    });

    // 对于 imagesB 中的每个哈希，找到 imagesA 中最相似的哈希
    const simB = imagesB.map(hashB => {
        let bestSim = 0;
        for (const hashA of imagesA) {
            if (hashB.length === hashA.length) {
                const distance = hammingDistance(hashB, hashA);
                const sim = 1 - (distance / maxDistance);
                if (sim > bestSim) bestSim = sim;
            }
        }
        return bestSim;
    });

    const allSim = simA.concat(simB);
    const avgSim = allSim.reduce((acc, val) => acc + val, 0) / allSim.length;
    return avgSim;
}

/**
 * 计算文档结构相似度：使用集合交集与并集计算
 * @param structA 结构数组A
 * @param structB 结构数组B
 * @returns 返回相似度（0~1）
 */
function calculateStructureSimilarity(structA: string[], structB: string[]): number {
    const setA = new Set(structA);
    const setB = new Set(structB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 1 : intersection.size / union.size;
}

/**
 * 计算元数据相似度
 * @param metaA 元数据对象A
 * @param metaB 元数据对象B
 * @returns 返回相似度（0~1）
 */
function calculateMetadataSimilarity(metaA: { [key: string]: any }, metaB: { [key: string]: any }): number {
    let score = 0;
    if (metaA.author && metaB.author && metaA.author === metaB.author) {
        score += 0.5;
    }
    if (metaA.modifiedDate && metaB.modifiedDate) {
        const diff = Math.abs(new Date(metaA.modifiedDate).getTime() - new Date(metaB.modifiedDate).getTime());
        if (diff < 7 * 24 * 60 * 60 * 1000) { // 时间差小于一周
            score += 0.5;
        }
    }
    return score;
}

/**
 * 计算综合相似度：根据各项相似度的权重进行加权平均
 * @param textSim 文本相似度
 * @param imageSim 图像相似度
 * @param structSim 结构相似度
 * @param metaSim 元数据相似度
 * @returns 返回综合相似度
 */
function calculateOverallSimilarity(
    textSim: number,
    imageSim: number,
    structSim: number,
    metaSim: number
): number {
    const weights = {text: 0.3, image: 0.4, structure: 0.2, metadata: 0.1};
    return (
        weights.text * textSim +
        weights.image * imageSim +
        weights.structure * structSim +
        weights.metadata * metaSim
    );
}


/**
 * 主分析函数：依次解析每个 docx 文件，并两两比对
 * @param filePaths 文件路径数组
 * @returns 返回包含比对结果与抄袭嫌疑网络的对象
 */
export async function analyzeDocxFiles(filePaths: string[]): Promise<AnalysisResult> {
    const analyses: DocxAnalysis[] = [];
    const totalFiles = filePaths.length;
    console.log(`开始分析 ${totalFiles} 个文件...`);

    // 依次解析每个文件
    for (let index = 0; index < totalFiles; index++) {
        const file = filePaths[index];
        console.log(`正在解析第 ${index + 1} 个文件: ${file}`);
        try {
            // 检查文件是否存在
            if (!fs.existsSync(file)) {
                console.error(`文件 ${file} 不存在，跳过该文件。`);
                continue;
            }
            // 检查文件扩展名是否为 .docx
            if (!file.toLowerCase().endsWith('.docx')) {
                console.error(`文件 ${file} 不是 docx 格式，跳过该文件。`);
                continue;
            }

            const analysis = await parseDocx(file);
            analyses.push(analysis);
            console.log(`解析完成: ${file}`);
        } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error);
        }
    }

    if (analyses.length === 0) {
        console.error("没有成功解析的文件。");
        return { comparisons: [], plagiarismNetwork: [] };
    }

    console.log(`共成功解析 ${analyses.length} 个文件，开始进行两两比对...`);

    // 两两比对构建分析结果
    const comparisons: PairwiseComparison[] = [];
    let totalComparisons = (analyses.length * (analyses.length - 1)) / 2;
    let currentComparison = 0;
    for (let i = 0; i < analyses.length; i++) {
        for (let j = i + 1; j < analyses.length; j++) {
            currentComparison++;
            // 计算各项相似度
            const textSim = calculateTextSimilarity(analyses[i].text, analyses[j].text);
            const imageSim = calculateImageSimilarity(analyses[i].images, analyses[j].images);
            const structSim = calculateStructureSimilarity(analyses[i].structure, analyses[j].structure);
            const metaSim = calculateMetadataSimilarity(analyses[i].metadata, analyses[j].metadata);

            const overallSim = calculateOverallSimilarity(textSim, imageSim, structSim, metaSim);
            comparisons.push({
                fileA: analyses[i].filePath,
                fileB: analyses[j].filePath,
                textSimilarity: parseFloat(textSim.toFixed(2)),
                imageSimilarity: parseFloat(imageSim.toFixed(2)),
                structureSimilarity: parseFloat(structSim.toFixed(2)),
                metadataSimilarity: parseFloat(metaSim.toFixed(2)),
                overallSimilarity: parseFloat(overallSim.toFixed(2))
            });

            // 输出当前比对进度，每完成 10% 输出一次进度信息
            if (currentComparison % Math.ceil(totalComparisons / 10) === 0 || currentComparison === totalComparisons) {
                console.log(`已完成 ${currentComparison}/${totalComparisons} 对文件的比对`);
            }
        }
    }

    // 构造抄袭嫌疑网络：整体相似度大于 0.7 的两篇文档视为存在抄袭嫌疑
    const plagiarismNetwork = comparisons.filter(c => c.overallSimilarity > 0.7)
        .map(c => ({
            source: c.fileA,
            target: c.fileB,
            similarity: c.overallSimilarity
        }));

    console.log("分析完成。");
    return { comparisons, plagiarismNetwork };
}