// file: src/utils/documentStructureUtils.ts

import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

/**
 * 从 DOCX（ZIP）包中提取文档结构中的所有标题文本。
 * 该函数定位 word/document.xml 文件，解析出所有带有 Heading 样式的段落文本。
 *
 * @param zip - 已打开的 AdmZip 实例，指向一个 DOCX 文件。
 * @returns Promise<string[]> - 标题文本数组，按文档中出现顺序返回；若未找到 document.xml，返回空数组。
 */
export async function extractDocumentStructure(zip: AdmZip): Promise<string[]> {
    // 获取 document.xml 条目
    const entry = zip.getEntry('word/document.xml');
    if (!entry) {
        // 未找到文档主体，返回空标题列表
        return [];
    }
    // 读取 XML 内容并转换为字符串
    const xml = entry.getData().toString('utf-8');
    // 将 XML 字符串解析为 JS 对象
    const doc: any = await parseStringPromise(xml);
    // 定位到 w:document > w:body > w:p（段落）数组
    const ps: any[] = doc['w:document']?.['w:body']?.[0]?.['w:p'] || [];

    const titles: string[] = [];
    // 遍历每个段落，筛选样式为 Heading 的段落
    ps.forEach((p: any) => {
        // 获取段落属性中的样式值，如 "Heading1", "Heading2" 等
        const style: string | undefined = p['w:pPr']?.[0]?.['w:pStyle']?.[0]?.['$']?.['w:val'];
        // 判断样式是否以 "Heading" 开头（忽略大小写）
        if (style && /^Heading/i.test(style)) {
            // 提取该段落中所有运行（w:r）内的文本节点（w:t），并拼接
            const text = (p['w:r'] || [])
                .map((r: any) => (r['w:t'] || []).join(''))
                .join(' ');
            // 去除首尾空白后，加入标题列表
            titles.push(text.trim());
        }
    });

    return titles;
}

/**
 * 计算两组文档结构（标题列表）之间的相似度得分，基于 Jaccard 系数。
 * 相似度 = 交集大小 / 并集大小；若两者均为空，则视为完全相似 (1)。
 *
 * @param A - 第一组标题字符串数组
 * @param B - 第二组标题字符串数组
 * @returns number - 0 到 1 之间的相似度得分
 */
export function calculateStructureSimilarity(A: string[], B: string[]): number {
    // 将数组转换为 Set 以去重并便于集合运算
    const SA = new Set(A);
    const SB = new Set(B);
    // 计算交集元素的数量
    const interSize = [...SA].filter(x => SB.has(x)).length;
    // 计算并集大小
    const unionSize = new Set([...SA, ...SB]).size;
    // 若并集非空，则返回交并比；否则（两组皆空），返回 1
    return unionSize ? interSize / unionSize : 1;
}
