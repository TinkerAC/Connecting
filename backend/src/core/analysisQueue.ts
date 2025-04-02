// backend/src/core/analysisQueue.ts
import {v4 as uuidv4} from 'uuid';
import {AnalysisResult, analyzeDocxFiles, buildPlagiarismNetwork} from './analyzer';

export interface AnalysisTask {
    id: string;
    submissionInfos: { filePath: string, studentId: string, studentName: string }[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: AnalysisResult;
    error?: string;
}

const taskQueue: AnalysisTask[] = [];
const tasksMap = new Map<string, AnalysisTask>();

/**
 * 提交分析任务，返回任务 UUID
 */
export async function submitAnalysisTask(
    submissionInfos: { filePath: string, studentId: string, studentName: string }[]
): Promise<string> {
    const id = uuidv4();
    const task: AnalysisTask = {id, submissionInfos, status: 'pending'};
    taskQueue.push(task);
    tasksMap.set(id, task);

    return id;
}

/**
 * 查询任务状态
 */
export function getTaskStatus(id: string): AnalysisTask | undefined {
    return tasksMap.get(id);
}

/**
 * 处理队列中的下一个任务（FIFO 顺序）
 */
async function processNextTask(): Promise<void> {
    if (taskQueue.length === 0) return;
    const task = taskQueue.shift();
    if (!task) return;
    task.status = 'processing';
    try {
        // 分析文件内容，假设 analyzeDocxFiles 返回比较结果数组
        const analysisResult: AnalysisResult = await analyzeDocxFiles(
            task.submissionInfos.map(s => s.filePath)
        );
        // 构造抄袭网络：将比较结果与提交记录结合
        const plagiarismNetwork = buildPlagiarismNetwork(analysisResult.comparisons, 0.7);
        task.result = analysisResult;
        task.status = 'completed';
    } catch (err: any) {
        task.status = 'failed';
        task.error = err.message;
    }
}

/**
 * 定时处理队列，每秒处理一个任务
 */
setInterval(() => {
    processNextTask();
}, 1000);