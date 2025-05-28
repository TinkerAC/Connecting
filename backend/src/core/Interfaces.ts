// file: src/Interfaces.ts

/**
 * 文档元数据接口，包含标准属性（如作者、创建时间等）
 * 以及自定义字段的灵活扩展。
 */
export interface Meta {
    author?: string;
    lastModifiedBy?: string;
    company?: string;
    manager?: string;

    created?: string;
    modified?: string;
    lastPrinted?: string;

    revisionNumber?: number;
    totalEditingTime?: number;
    application?: string;

    template?: string;
    category?: string;
    subject?: string;
    keywords?: string;
    title?: string;

    pageCount?: number;
    wordCount?: number;
    charCount?: number;
    paragraphCount?: number;

    // 自定义字段
    [k: string]: any;
}

/**
 * DOCX 文件分析结果接口，包含文件路径、文本内容、图片哈希、文档结构标题
 * 以及元数据等信息的提取结果。
 */
export interface DocxAnalysis {
    filePath: string;
    text: string;
    images: string[];
    structure: string[];
    metadata: Meta;
}

/**
 * 两份文件之间的对比结果接口，包含文本、图片、结构和元数据的相似度评分
 * 以及总体相似度。
 */
export interface PairwiseComparison {
    fileA: string;
    fileB: string;
    textSimilarity: number;
    imageSimilarity: number;
    structureSimilarity: number;
    metadataSimilarity: number;
    overallSimilarity: number;
}

/**
 * 分析执行结果接口，包含所有文件两两对比的结果数组
 * 以及用于描绘抄袭网络关系的节点连接信息。
 */
export interface AnalysisResult {
    comparisons: PairwiseComparison[];
    plagiarismNetwork: { source: string; target: string; similarity: number }[];
}