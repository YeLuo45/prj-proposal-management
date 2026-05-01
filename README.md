# 提案管理系统 (Proposals Manager)

## 访问 URL
**https://yeluo45.github.io/proposals-manager/**

## 项目描述
提案包与访问链接管理系统 — 支持项目管理、提案管理和里程碑追踪。

## 功能特性

### 项目管理
- ✅ **项目列表**：卡片/表格视图，分页显示
- ✅ **项目详情页**：`/project/:id` 独立路由
- ✅ **新建项目**：自动生成项目 ID (PRJ-YYYYMMDD-XXX)
- ✅ **编辑/删除项目**

### 提案管理
- ✅ **提案列表视图**：卡片/表格切换，分页显示（每页12条）
- ✅ **实时搜索**：300ms防抖，搜索名称、描述和标签
- ✅ **类型筛选**：按 Web/App/Package 类型筛选
- ✅ **状态筛选**：按 Active/In Dev/Archived 状态筛选
- ✅ **添加提案**：弹窗表单，自动生成 ID (P-YYYYMMDD-XXX 格式)
- ✅ **编辑提案**：所有字段可编辑（ID 除外）
- ✅ **提案归属项目**：可将提案关联到项目

### 里程碑管理
- ✅ **里程碑时间线**：可视化展示项目进度
- ✅ **添加/编辑/删除里程碑**
- ✅ **里程碑状态**：待开始/进行中/已完成
- ✅ **关联提案**：可将提案关联到里程碑

### 技术功能
- 🔍 **实时搜索**：300ms防抖，搜索名称、描述和标签
- 📦 **上传包文件**：上传文件到 GitHub Release Assets
- 📋 **一键复制链接**：复制 URL 或包下载链接到剪贴板
- 💾 **GitHub API 同步**：数据持久化到 GitHub

## 目录结构
```
proposals-manager/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # 顶部导航栏
│   │   ├── SearchBar.jsx       # 搜索栏组件
│   │   ├── FilterBar.jsx       # 筛选栏组件
│   │   ├── ProposalCard.jsx    # 提案卡片组件
│   │   ├── ProposalForm.jsx    # 提案表单组件
│   │   ├── ProjectCard.jsx     # 项目卡片组件
│   │   ├── ProjectForm.jsx     # 项目表单组件
│   │   ├── MilestoneTimeline.jsx  # 里程碑时间线
│   │   ├── MilestoneForm.jsx      # 里程碑表单
│   │   └── pages/
│   │       └── ProjectDetailPage.jsx  # 项目详情页
│   ├── hooks/
│   │   └── useGitHub.js        # GitHub API 操作钩子
│   ├── App.jsx                 # 主应用组件（含路由）
│   ├── index.css               # 全局样式
│   └── main.jsx                # 入口文件
├── data/
│   └── proposals.json           # 提案数据存储（v3格式）
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 部署
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 数据结构（v3）
```json
{
  "version": 3,
  "projects": [
    {
      "id": "PRJ-YYYYMMDD-XXX",
      "name": "项目名称",
      "description": "项目描述",
      "createdAt": "YYYY-MM-DD",
      "updatedAt": "YYYY-MM-DD",
      "milestones": [
        {
          "id": "MS-XXX",
          "name": "里程碑名称",
          "description": "里程碑描述",
          "targetDate": "YYYY-MM-DD",
          "status": "pending|in_progress|completed",
          "proposalIds": ["P-YYYYMMDD-XXX"],
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
      ]
    }
  ],
  "proposals": [
    {
      "id": "P-YYYYMMDD-XXX",
      "name": "提案名称",
      "projectId": "PRJ-XXX",
      "description": "提案描述",
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

## 本地运行
```bash
# 安装依赖
npm install

# 安装 React Router
npm install react-router-dom@6

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 配置说明

### 设置 GitHub PAT
1. 首次使用时会提示输入 GitHub Personal Access Token
2. Token 存储在浏览器 localStorage 中
3. Token 需要以下权限：
   - `repo` (完整仓库访问) - 用于读写 proposals.json

## 部署说明
- 部署方式：GitHub Actions 自动部署到 GitHub Pages
- 触发条件：push 到 main 分支
- 构建产物：dist/ 目录（含 data/proposals.json）
