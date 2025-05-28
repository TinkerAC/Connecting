// file: src/utils/metadataSimilarityUtils.ts

import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { Meta } from '../Interfaces';

/**
 * 工具函数：从 ZIP（DOCX）中读取指定文件内容，并以 UTF-8 字符串形式返回。
 * @param zip - 已打开的 AdmZip 实例
 * @param name - 目标文件路径（例如 'docProps/core.xml'）
 * @returns 文件内容字符串，如果文件不存在则返回 null
 */
const txt = (zip: AdmZip, name: string): string | null =>
    zip.getEntry(name)?.getData().toString('utf-8') ?? null;

/**
 * 工具函数：获取数组中的第一个元素。如果传入值不是数组，直接返回该值。
 * @param v - 可能是数组或单值
 * @returns 数组首项或原值，若数组为空则返回 undefined
 */
const first = <T = any>(v: any): T | undefined =>
    Array.isArray(v) ? (v[0] as T) : (v as T | undefined);

/**
 * 从 DOCX（ZIP）中提取文档元数据，包括作者、创建时间、标题等。
 * 依次读取 core.xml、app.xml、custom.xml 三个文档属性文件。
 * @param zip - 已打开的 AdmZip 实例
 * @returns 包含所有解析到的元数据字段的对象
 */
export async function extractMetadata(zip: AdmZip): Promise<Meta> {
    const meta: Meta = {};

    // --- 处理 core.xml: 基本文档属性 ---
    const core = txt(zip, 'docProps/core.xml');
    if (core) {
        // 解析 XML 字符串为 JS 对象
        const x: any = await parseStringPromise(core);
        const c = x['cp:coreProperties'] ?? {};

        // dc:creator -> 作者
        meta.author = first<string>(c['dc:creator']);
        // cp:lastModifiedBy -> 最后修改人
        meta.lastModifiedBy = first<string>(c['cp:lastModifiedBy']);
        // dcterms:created -> 创建时间，可能为对象或文本
        meta.created = first<any>(c['dcterms:created'])?._ ?? first<string>(c['dcterms:created']);
        // dcterms:modified -> 最后修改时间
        meta.modified = first<any>(c['dcterms:modified'])?._ ?? first<string>(c['dcterms:modified']);
        // 其他标准字段
        meta.subject = first<string>(c['dc:subject']);
        meta.title = first<string>(c['dc:title']);
        meta.keywords = first<string>(c['cp:keywords']);
        meta.category = first<string>(c['cp:category']);
    }

    // --- 处理 app.xml: 应用与文档统计信息 ---
    const app = txt(zip, 'docProps/app.xml');
    if (app) {
        const p: any = (await parseStringPromise(app)).Properties ?? {};

        // 常见应用属性及统计数字
        meta.template = first<string>(p.Template);
        meta.application = first<string>(p.Application);
        meta.revisionNumber = Number(first(p.RevisionNumber));        // 修订版本号
        meta.totalEditingTime = Number(first(p.TotalTime));           // 累积编辑时间（分钟）
        meta.pageCount = Number(first(p.Pages));                     // 页数
        meta.wordCount = Number(first(p.Words));                     // 单词数
        meta.charCount = Number(first(p.Characters));                // 字符数
        meta.paragraphCount = Number(first(p.Paragraphs));           // 段落数
        meta.company = first<string>(p.Company);                     // 公司
        meta.manager = first<string>(p.Manager);                     // 文档管理员
        meta.lastPrinted = first<string>(p.LastPrinted);             // 最后打印时间
    }

    // --- 处理 custom.xml: 自定义属性 ---
    const custom = txt(zip, 'docProps/custom.xml');
    if (custom) {
        // Properties.property 数组中，每项含 $ (属性元数据) 及自身字段
        const props: any[] = (await parseStringPromise(custom)).Properties?.property ?? [];
        props.forEach((p: any) => {
            const name = p.$?.name as string | undefined; // 自定义属性名
            let value: string | undefined;
            // 遍历字段，找到第一个字符串值
            for (const [k, v] of Object.entries(p)) {
                if (k === '$' || !Array.isArray(v)) continue;
                const firstVal = (v as any)[0];
                if (typeof firstVal === 'string') {
                    value = firstVal;
                    break;
                }
            }
            if (name && value) meta[name] = value;
        });
    }

    return meta;
}

/**
 * 简单字符串相似度：忽略大小写和首尾空白，完全相同则返回 1，否则返回 0。
 * @param a - 第一个字符串
 * @param b - 第二个字符串
 */
function strSim(a?: string, b?: string): number {
    return a && b && a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
}

/**
 * 日期相似度：如果两日期相差在 d 天内，返回 1；在 2*d 天内返回 0.5；否则返回 0。
 * @param a - 第一个日期字符串
 * @param b - 第二个日期字符串
 * @param d - 相差阈值（天数）
 */
function dateSim(a?: string, b?: string, d = 7): number {
    if (!a || !b) return 0;
    const diffMs = Math.abs(+new Date(a) - +new Date(b));
    const oneDayMs = 864e5;
    if (diffMs <= d * oneDayMs) return 1;
    if (diffMs <= 2 * d * oneDayMs) return 0.5;
    return 0;
}

/**
 * 数值相似度：基于相对误差阈值 tol，误差 <= tol 返回 1；<= 2*tol 返回 0.5；否则 0。
 * @param a - 第一个数值
 * @param b - 第二个数值
 * @param tol - 相对误差容忍度（默认 2%）
 */
function numSim(a?: number, b?: number, tol = 0.02): number {
    if (a == null || b == null || isNaN(a) || isNaN(b)) return 0;
    const delta = Math.abs(a - b) / Math.max(1, (a + b) / 2);
    if (delta <= tol) return 1;
    if (delta <= tol * 2) return 0.5;
    return 0;
}

/**
 * 计算两份文档元数据的综合相似度得分（0-1）。
 * 将各字段按预设权重加权求和，再除以权重总和，得到最终得分。
 * 支持字符串、日期、数值等多种类型的相似度度量。
 * @param A - 第一份 Meta 对象
 * @param B - 第二份 Meta 对象
 */
export function calculateMetadataSimilarity(A: Meta, B: Meta): number {
    // 定义各字段相似度函数及其权重
    const rules = [
        { w: 0.12, s: () => strSim(A.author, B.author) },
        { w: 0.05, s: () => strSim(A.lastModifiedBy, B.lastModifiedBy) },
        { w: 0.03, s: () => strSim(A.company, B.company) },
        { w: 0.02, s: () => strSim(A.manager, B.manager) },

        { w: 0.12, s: () => dateSim(A.created, B.created, 3) },
        { w: 0.08, s: () => dateSim(A.modified, B.modified, 7) },
        { w: 0.02, s: () => dateSim(A.lastPrinted, B.lastPrinted, 7) },

        { w: 0.04, s: () => numSim(A.revisionNumber, B.revisionNumber) },
        { w: 0.03, s: () => numSim(A.totalEditingTime, B.totalEditingTime, 0.1) },
        { w: 0.02, s: () => strSim(A.application, B.application) },

        { w: 0.06, s: () => strSim(A.template, B.template) },
        { w: 0.02, s: () => strSim(A.subject, B.subject) },
        { w: 0.02, s: () => strSim(A.category, B.category) },
        { w: 0.02, s: () => strSim(A.keywords, B.keywords) },

        { w: 0.06, s: () => numSim(A.pageCount, B.pageCount, 0.05) },
        { w: 0.04, s: () => numSim(A.wordCount, B.wordCount, 0.05) },
        { w: 0.03, s: () => numSim(A.charCount, B.charCount, 0.05) },
    ];

    // 如果 Meta 中包含 studentId，则也计算其相似度
    if (A.studentId && B.studentId) {
        rules.push({ w: 0.05, s: () => strSim(A.studentId, B.studentId) });
    }

    // 计算权重总和 W 和加权相似度和 S
    const W = rules.reduce((sum, r) => sum + r.w, 0);
    const S = rules.reduce((sum, r) => sum + r.w * r.s(), 0);

    // 返回归一化后得分，保留四位小数
    return +(S / W).toFixed(4);
}