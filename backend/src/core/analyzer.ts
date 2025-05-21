import fs from 'fs';
import {AnalysisResult, DocxAnalysis, PairwiseComparison} from "./analyzer/types";
import {parseDocx} from "./analyzer/parseDocx";
import {calculateTextSimilarity} from "./analyzer/text";
import {calculateStructureSimilarity} from "./analyzer/stucture";
import {calculateImageSimilarity} from "./analyzer/image";
import {calculateMetadataSimilarity} from "./analyzer/metadata";
import {buildPlagiarismNetwork, calculateOverallSimilarity} from "./analyzer/overall";


/* 主分析流程 */
export async function analyzeDocxFiles(paths: string[]): Promise<AnalysisResult> {
    const analyses: DocxAnalysis[] = [];
    for (const p of paths) {
        if (!fs.existsSync(p) || !p.toLowerCase().endsWith('.docx')) {
            console.warn(`跳过文件: ${p}`);
            continue;
        }
        analyses.push(await parseDocx(p));
    }
    if (analyses.length < 2) return {comparisons: [], plagiarismNetwork: []};

    const comps: PairwiseComparison[] = [];
    for (let i = 0; i < analyses.length; i++) {
        for (let j = i + 1; j < analyses.length; j++) {
            const A = analyses[i], B = analyses[j];
            const t = calculateTextSimilarity(A.text, B.text);
            const iS = calculateImageSimilarity(A.images, B.images);
            const s = calculateStructureSimilarity(A.structure, B.structure);
            const m = calculateMetadataSimilarity(A.metadata, B.metadata);
            const o = calculateOverallSimilarity(t, iS, s, m);

            comps.push({
                fileA: A.filePath, fileB: B.filePath,
                textSimilarity: +t.toFixed(2),
                imageSimilarity: +iS.toFixed(2),
                structureSimilarity: +s.toFixed(2),
                metadataSimilarity: +m.toFixed(2),
                overallSimilarity: +o.toFixed(2)
            });
        }
    }

    return {
        comparisons: comps,
        plagiarismNetwork: buildPlagiarismNetwork(comps)
    };
}