import AdmZip from 'adm-zip';
import {parseStringPromise} from 'xml2js';
import {Meta} from "./types";


/* ---------- 工具 ---------- */
const txt = (zip: AdmZip, name: string) =>
    zip.getEntry(name)?.getData().toString('utf-8') ?? null;

const first = <T = any>(v: any): T | undefined =>
    Array.isArray(v) ? (v[0] as T) : (v as T | undefined);

/* ---------- 元数据提取 ---------- */
export async function extractMetadata(zip: AdmZip): Promise<Meta> {
    const meta: Meta = {};

    /* ------- core.xml ------- */
    const core = txt(zip, 'docProps/core.xml');
    if (core) {
        const x: any = await parseStringPromise(core);
        const c = x['cp:coreProperties'] ?? {};

        meta.author = first<string>(c['dc:creator']);
        meta.lastModifiedBy = first<string>(c['cp:lastModifiedBy']);
        meta.created = first<any>(c['dcterms:created'])?._ ?? first<string>(c['dcterms:created']);
        meta.modified = first<any>(c['dcterms:modified'])?._ ?? first<string>(c['dcterms:modified']);
        meta.subject = first<string>(c['dc:subject']);
        meta.title = first<string>(c['dc:title']);
        meta.keywords = first<string>(c['cp:keywords']);
        meta.category = first<string>(c['cp:category']);
    }

    /* ------- app.xml ------- */
    const app = txt(zip, 'docProps/app.xml');
    if (app) {
        const p: any = (await parseStringPromise(app)).Properties ?? {};

        meta.template = first<string>(p.Template);
        meta.application = first<string>(p.Application);
        meta.revisionNumber = Number(first(p.RevisionNumber));
        meta.totalEditingTime = Number(first(p.TotalTime));
        meta.pageCount = Number(first(p.Pages));
        meta.wordCount = Number(first(p.Words));
        meta.charCount = Number(first(p.Characters));
        meta.paragraphCount = Number(first(p.Paragraphs));
        meta.company = first<string>(p.Company);
        meta.manager = first<string>(p.Manager);
        meta.lastPrinted = first<string>(p.LastPrinted);
    }

    /* ------- custom.xml ------- */
    const custom = txt(zip, 'docProps/custom.xml');
    if (custom) {
        const props: any[] =
            (await parseStringPromise(custom)).Properties?.property ?? [];

        props.forEach((p: any) => {
            const name = p.$?.name as string | undefined;
            let value: string | undefined;

            // 在所有键里找第一个数组且首元素为字符串的值
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

/* ---------- 相似度算法 ---------- */
function strSim(a?: string, b?: string) {
    return a && b && a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0;
}

function dateSim(a?: string, b?: string, d = 7) {
    if (!a || !b) return 0;
    const diff = Math.abs(+new Date(a) - +new Date(b));
    return diff <= d * 864e5 ? 1 : diff <= d * 2 * 864e5 ? 0.5 : 0;
}

function numSim(a?: number, b?: number, tol = 0.02) {
    if (a == null || b == null || isNaN(a) || isNaN(b)) return 0;
    const delta = Math.abs(a - b) / Math.max(1, (a + b) / 2);
    return delta <= tol ? 1 : delta <= tol * 2 ? 0.5 : 0;
}

export function calculateMetadataSimilarity(A: Meta, B: Meta): number {
    const rules = [
        {w: 0.12, s: () => strSim(A.author, B.author)},
        {w: 0.05, s: () => strSim(A.lastModifiedBy, B.lastModifiedBy)},
        {w: 0.03, s: () => strSim(A.company, B.company)},
        {w: 0.02, s: () => strSim(A.manager, B.manager)},

        {w: 0.12, s: () => dateSim(A.created, B.created, 3)},
        {w: 0.08, s: () => dateSim(A.modified, B.modified, 7)},
        {w: 0.02, s: () => dateSim(A.lastPrinted, B.lastPrinted, 7)},

        {w: 0.04, s: () => numSim(A.revisionNumber, B.revisionNumber)},
        {w: 0.03, s: () => numSim(A.totalEditingTime, B.totalEditingTime, 0.1)},
        {w: 0.02, s: () => strSim(A.application, B.application)},

        {w: 0.06, s: () => strSim(A.template, B.template)},
        {w: 0.02, s: () => strSim(A.subject, B.subject)},
        {w: 0.02, s: () => strSim(A.category, B.category)},
        {w: 0.02, s: () => strSim(A.keywords, B.keywords)},

        {w: 0.06, s: () => numSim(A.pageCount, B.pageCount, 0.05)},
        {w: 0.04, s: () => numSim(A.wordCount, B.wordCount, 0.05)},
        {w: 0.03, s: () => numSim(A.charCount, B.charCount, 0.05)},
    ];

    if (A.studentId && B.studentId)
        rules.push({w: 0.05, s: () => strSim(A.studentId, B.studentId)});

    const W = rules.reduce((s, r) => s + r.w, 0);
    const S = rules.reduce((s, r) => s + r.w * r.s(), 0);
    return +(S / W).toFixed(4);
}