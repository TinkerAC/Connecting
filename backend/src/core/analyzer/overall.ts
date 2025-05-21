

/* 综合相似度 */
import {PairwiseComparison} from "./types";

export function calculateOverallSimilarity(text: number, image: number, structure: number, meta: number) {
    const w = {text: 0.3, image: 0.4, structure: 0.2, metadata: 0.1};
    return w.text * text + w.image * image + w.structure * structure + w.metadata * meta;
}

/* 抄袭网络 */
export function buildPlagiarismNetwork(comps: PairwiseComparison[], threshold = 0.7) {
    return comps
        .filter(c => c.overallSimilarity > threshold)
        .map(c => ({source: c.fileA, target: c.fileB, similarity: c.overallSimilarity}));
}