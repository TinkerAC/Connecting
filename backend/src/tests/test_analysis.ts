import fs from "fs";
import {analyzeDocxFiles} from "../core/analyzer";
// mock 文件路径和文件内容, 从 assets/exp2 下遍历每个文件夹, 提取每个文件夹中的一个随机文件, 将其作为路径列表传入
const filePaths = fs.readdirSync('assets/exp2').map((dir) => {
    const files = fs.readdirSync(`assets/exp2/${dir}`);
    const randomFile = files[Math.floor(Math.random() * files.length)];
    if (randomFile) {
        return `assets/exp2/${dir}/${randomFile}`;
    }
}).filter(Boolean);

// 调用 analyzeDocxFiles 进行分析
analyzeDocxFiles(filePaths as string[]).then(analysisResult => {
    if (!analysisResult || !analysisResult.comparisons || analysisResult.comparisons.length === 0) {
        console.log("No comparisons found.");
        return;
    }

    // 按 图像相似度 降序排序
    const sortedComps = analysisResult.comparisons.sort(
        (a, b) => b.imageSimilarity - a.imageSimilarity
    );

    // 取前 10 项（如果不足 10 项，则取所有项）
    const topComparisons = sortedComps.slice(0, 50);

    console.log("Top 10 highest similarity comparisons:");
    // console.table(topComparisons.map(comp => ({
    //     "File A": comp.fileA,
    //     "File B": comp.fileB,
    //     "Overall Similarity": comp.overallSimilarity.toFixed(2),
    //     "Text Similarity": comp.textSimilarity.toFixed(2),
    //     "Image Similarity": comp.imageSimilarity.toFixed(2),
    //     "Structure Similarity": comp.structureSimilarity.toFixed(2),
    //     "Metadata Similarity": comp.metadataSimilarity.toFixed(2)
    // })));

    console.log(topComparisons);
}).catch(error => {
    console.error("Error running analysis:", error);
});