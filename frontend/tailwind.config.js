module.exports = {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            // 如果想把「blob」动画写进 Tailwind，这里可追加：
            // keyframes: { blob: { '0%,100%':{...}, '33%':{...}, '66%':{...} } },
            // animation: { blob: 'blob 20s infinite ease-in-out' },
        },
    },
    plugins: [],
};