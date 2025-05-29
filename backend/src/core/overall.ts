// src/similarity.ts
import { PairwiseComparison } from "./Interfaces";
import {config} from "../utils/loadConfig";

/** 计算综合相似度；可传入自定义权重，否则用配置文件中的 */
export function calculateOverallSimilarity(
    text: number,
    image: number,
    structure: number,
    meta: number,
    weights = config.weights
): number {
    return (
        weights.text      * text     +
        weights.image     * image    +
        weights.structure * structure+
        weights.metadata  * meta
    );
}

/** 构建抄袭网络；可传入自定义阈值，否则用配置文件中的 */
export function buildPlagiarismNetwork(
    comps: PairwiseComparison[],
    threshold = config.threshold
) {
    return comps
        .filter(c => c.overallSimilarity > threshold)
        .map(c => ({
            source:     c.fileA,
            target:     c.fileB,
            similarity: c.overallSimilarity
        }));
}