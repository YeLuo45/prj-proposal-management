# 提案管理系统

提案包与访问链接管理网站 — 统一管理项目ID、名称、描述、访问链接和下载包。

**访问地址**: https://yeluo45.github.io/proposals-manager/

---

## 功能特性

- **列表展示**：卡片/表格双视图切换，分页浏览
- **实时搜索**：300ms 防抖，搜索名称、描述、标签
- **多维筛选**：按类型（Web/App/Package）、按状态（Active/开发中/已归档）
- **新增提案**：自动生成提案ID（P-YYYYMMDD-XXX格式）
- **编辑提案**：修改所有字段（ID不可改）
- **删除提案**：确认后删除
- **一键复制**：复制访问链接/下载链接到剪贴板
- **GitHub 数据存储**：所有数据通过 GitHub API 持久化到仓库

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite 5 |
| 样式 | Tailwind CSS |
| 数据层 | GitHub REST API |
| 部署 | GitHub Pages |

---

## 目录结构

```
proposals-manager/
├── src/
│   ├── components/
│   │   ├── Header.jsx        # 顶部导航 + Token配置
│   │   ├── SearchBar.jsx     # 搜索框（防抖）
│   │   ├── FilterBar.jsx     # 筛选器 + 视图切换
│   │   ├── ProposalCard.jsx   # 卡片/表格视图
│   │   └── ProposalForm.jsx   # 新增/编辑表单
│   ├── hooks/
│   │   └── useGitHub.js       # GitHub API 操作
│   ├── App.jsx                # 主应用
│   ├── index.css              # Tailwind 入口
│   └── main.jsx               # React 入口
├── data/
│   └── proposals.json         # 提案数据
├── index.html
├── vite.config.js
└── package.json
```

---

## 配置说明

首次使用需要配置 GitHub Personal Access Token（PAT）：

1. 点击右上角 **⚙️ 配置**
2. 输入 PAT（格式：`ghp_xxx...`）
3. 点击保存

**Token 权限要求**：
- `repo` — 读写仓库文件（操作 `data/proposals.json`）
- Token 仅存储在浏览器 localStorage 中

---

## 本地运行

```bash
npm install
npm run dev
```

---

## 数据格式

```json
{
  "proposals": [
    {
      "id": "P-YYYYMMDD-XXX",
      "name": "项目名称",
      "description": "项目描述",
      "type": "web | app | package",
      "status": "active | in_dev | archived",
      "url": "https://...",
      "packageUrl": "https://...",
      "tags": ["标签1", "标签2"],
      "createdAt": "YYYY-MM-DD",
      "updatedAt": "YYYY-MM-DD"
    }
  ]
}
```
