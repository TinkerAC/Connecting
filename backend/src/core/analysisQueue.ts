import {v4 as uuidv4} from 'uuid';
import {AnalysisResult, analyzeDocxFiles} from './analyzer';


export interface AnalysisTask {
    id: string;
    filePaths: string[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: AnalysisResult;
    error?: string;
}

const taskQueue: AnalysisTask[] = [];
const tasksMap = new Map<string, AnalysisTask>();

/**
 * 提交分析任务，返回任务 UUID
 */
export async function submitAnalysisTask(filePaths: string[]): Promise<string> {
    const id = uuidv4();
    const task: AnalysisTask = {id, filePaths, status: 'pending'};
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
        task.result = await analyzeDocxFiles(task.filePaths);
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