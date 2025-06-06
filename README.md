# 项目名称：**Connecting**

## 项目概述

本项目是一个专注于 **DOCX 文档分析与相似性检测的系统**
。旨在通过对文档的多个维度（包括文本内容、图像、元数据和结构）进行深度分析，计算文档间的相似度，并辅助识别潜在的学术相似性或内容复用情况。系统后端采用
TypeScript 构建，确保了代码的健壮性和可维护性；前端则利用 Vue3 提供友好的用户交互界面。

---

## 🚀 主要功能

* **DOCX 文档解析**: 能够深入解析 `.docx` 文件，提取其核心组成部分。
    * 使用 `mammoth` 提取纯文本内容。
    * 利用 `adm-zip` 访问和解析 DOCX 文件包（ZIP 归档）中的内部文件，如 XML 和媒体文件。
* **多维度相似性分析**:
    * **文本相似度**:
        * 通过 `getWordFreq` 计算词频。
        * 采用**余弦相似度 (Cosine Similarity)** 算法比较文本内容的相似性。
    * **图像相似度**:
        * 提取文档中的图像，并计算其 **MD5 哈希值**。
        * 通过比较哈希值的**汉明距离 (Hamming Distance)** 来评估图像集的相似性。
    * **元数据相似度**:
        * 从 `core.xml`, `app.xml`, `custom.xml` 中提取作者、创建日期、修改日期、字数、页数等元数据。
        * 使用 `xml2js` 解析 XML。
        * 基于**加权规则**比较不同元数据字段的相似性。
    * **文档结构相似度**:
        * 提取文档中的标题（如 Heading1, Heading2 等）。
        * 采用**Jaccard 指数 (Jaccard Index)** 计算标题集合的相似性。
* **综合相似度评估**:
    * 将文本、图像、元数据和结构四个维度的相似度得分进行**加权平均**，得到一个总体的相似度评分。
    * 权重可配置，当前默认为：文本 (30%)、图像 (40%)、结构 (20%)、元数据 (10%)。

* **抄袭网络构建**:
    * 根据设定的阈值（如 70%），筛选出总体相似度较高的文档对。
    * 构建一个可视化网络图，展示文档间的相似关系。

---

## 🛠️ 技术栈

### 后端 (Backend)

* **语言**: **TypeScript**
    * 利用强类型系统提高代码质量和可维护性。
* **运行环境**: **Node.js**
* **核心库**:
    * `adm-zip`: 用于处理和解压 DOCX (ZIP) 文件。
    * `crypto`: Node.js 内置模块，用于生成 MD5 哈希值。
    * `xml2js`: 用于将 XML 数据（来自 DOCX 内部文件）解析为 JavaScript 对象。
    * `mammoth`: 用于从 DOCX 文件中提取纯文本内容。
* **ORM (对象关系映射器)**: **Sequelize**
    * 简化与数据库的交互，支持多种 SQL 数据库。

### 前端 (Frontend)

* **框架**: **Vue3**
    * 一个现代化的、渐进式的 JavaScript 框架，用于构建高效且美观的用户界面。

### 数据库 (Database)

* **类型**: **SQLite**
    * 一个轻量级的、基于文件的 SQL 数据库引擎，易于部署和集成。

* **ORM**:**Sequelize**

---

## 💡 核心算法与技术点

* **文本处理**: 词频统计 (Word Frequency Analysis)
* **哈希算法**: MD5 (用于图像文件指纹)
* **相似度/距离度量**:
    * 余弦相似度 (Cosine Similarity) - 用于文本
    * 汉明距离 (Hamming Distance) - 用于图像哈希比较
    * Jaccard 指数 (Jaccard Index) - 用于文档结构（标题集合）
* **数据解析**: XML 解析 (针对 DOCX 内部结构文件)
* **加权评分系统**: 用于综合评估不同维度的相似性结果。

___

## 安装

分别在根目录、frontend 、 backend 执行 npm install
或

```shell
node tools/setup.js

```

## 启动

pnpm:

```shell
pnpm run dev
```

npm:

```shell
npm run dev2
```

---

## 👥 团队/作者

* 后端:陈普阳
* 前端:李政辉

---