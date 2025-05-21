// 通用类型声明
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

export interface DocxAnalysis {
    filePath: string;
    text: string;
    images: string[];
    structure: string[];
    metadata: Meta;
}

export interface PairwiseComparison {
    fileA: string;
    fileB: string;
    textSimilarity: number;
    imageSimilarity: number;
    structureSimilarity: number;
    metadataSimilarity: number;
    overallSimilarity: number;
}

export interface AnalysisResult {
    comparisons: PairwiseComparison[];
    plagiarismNetwork: { source: string; target: string; similarity: number }[];
}