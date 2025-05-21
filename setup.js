#!/usr/bin/env node
/**
 * setup.js — 跨平台执行依赖安装脚本
 * 用法：在项目根目录执行 `node setup.js`
 */

const {spawn} = require('child_process')
const path = require('path')

/**
 * 运行一条命令
 * @param {string} cmd 可执行命令
 * @param {string[]} args 命令参数
 * @param {string} cwd 当前工作目录
 * @returns {Promise<void>}
 */
function run(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
        const ps = spawn(cmd, args, {
            cwd,
            stdio: 'inherit',
            shell: true    // 开启 shell，以兼容 Windows cmd
        })
        ps.on('close', code => {
            if (code === 0) resolve()
            else reject(new Error(`${cmd} ${args.join(' ')} 失败 (code ${code})`))
        })
    })
}

;(async () => {
    try {
        const root = process.cwd()
        console.log(`\n→ 安装根目录依赖：npm install`)
        await run('npm', ['install'], root)

        const fe = path.join(root, 'frontend')
        console.log(`\n→ 安装 frontend 依赖：cd frontend && npm install`)
        await run('npm', ['install'], fe)

        const be = path.join(root, 'backend')
        console.log(`\n→ 安装 backend 依赖：cd backend && npm install`)
        await run('npm', ['install'], be)

        console.log('\n🎉 安装完成！')
    } catch (err) {
        console.error('\n❌ 安装过程中出错：', err)
        process.exit(1)
    }
})()