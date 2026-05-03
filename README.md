# 提案管理系统 (Proposals Manager)

## 访问 URL
**https://yeluo45.github.io/prj-proposals-manager/**

## 项目描述
提案包与访问链接管理系统 — 管理提案ID、名称、描述、访问链接和下载包。

## 功能特性
- ✅ **提案列表视图**：卡片/表格切换，分页显示（每页12条）
- 🔍 **实时搜索**：300ms防抖，搜索名称、描述和标签
- 🎯 **类型筛选**：按 Web/App/Package 类型筛选
- 📊 **状态筛选**：按 Active/In Dev/Archived 状态筛选
- ➕ **添加提案**：弹窗表单，自动生成 ID (P-YYYYMMDD-XXX 格式)
- ✏️ **编辑提案**：所有字段可编辑（ID 除外）
- 📦 **上传包文件**：上传文件到 GitHub Release Assets
- 📋 **一键复制链接**：复制 URL 或包下载链接到剪贴板

## 目录结构
```
prj-proposals-manager/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.jsx      # 顶部导航栏
│   │   ├── ProposalCard.jsx # 提案卡片组件
│   │   ├── ProposalForm.jsx # 提案表单组件
│   │   ├── FilterBar.jsx   # 筛选栏组件
│   │   └── SearchBar.jsx   # 搜索栏组件
│   ├── hooks/
│   │   └── useGitHub.js    # GitHub API 操作钩子
│   ├── App.jsx             # 主应用组件
│   ├── index.css           # 全局样式
│   └── main.jsx            # 入口文件
├── data/
│   └── proposals.json      # 提案数据存储
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 配置说明

### 设置 GitHub PAT
1. 首次使用时会提示输入 GitHub Personal Access Token
2. Token 存储在浏览器 localStorage 中
3. Token 需要以下权限：
   - `repo` (完整仓库访问) - 用于读写 proposals.json

## 本地运行
```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 数据结构
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
