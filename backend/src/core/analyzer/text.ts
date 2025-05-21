export function getWordFreq(txt: string) {
    const f: Record<string, number> = {};
    (txt.toLowerCase().match(/\w+/g) || []).forEach(w => (f[w] = (f[w] || 0) + 1));
    return f;
}

export function calculateTextSimilarity(a: string, b: string): number {
    const fa = getWordFreq(a), fb = getWordFreq(b);
    const words = new Set([...Object.keys(fa), ...Object.keys(fb)]);
    let dot = 0, na = 0, nb = 0;
    words.forEach(w => {
        const x = fa[w] || 0, y = fb[w] || 0;
        dot += x * y; na += x * x; nb += y * y;
    });
    return !na || !nb ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}