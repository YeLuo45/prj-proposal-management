# P-20260502-001: proposals-manager — 项目管理增强 技术方案

## 1. 技术栈

- **框架**：React 18 + Vite 5
- **样式**：Tailwind CSS 3
- **路由**：React Router v6（新增）
- **状态**：React useState/useReducer（扩展现有模式）
- **数据**：localStorage + GitHub API（继承现有）

## 2. 数据模型

### 2.1 proposals.json v3 格式

```json
{
  "version": 3,
  "projects": [
    {
      "id": "PRJ-YYYYMMDD-XXX",
      "name": "string",
      "description": "string",
      "createdAt": "YYYY-MM-DD",
      "updatedAt": "YYYY-MM-DD",
      "milestones": [
        {
          "id": "MS-XXX",
          "name": "string",
          "description": "string",
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
      "name": "string",
      "projectId": "PRJ-XXX",  // 新增：关联项目
      ...
    }
  ]
}
```

### 2.2 向后兼容

- 读取时检测 `version` 字段
- 无 `version` 或 `version < 3`：执行迁移，将 `projects` 重构为包含空 `milestones` 数组
- 写入时始终使用 v3 格式

## 3. 路由设计

### 3.1 新增路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/project/:id` | `ProjectDetailPage` | 项目详情页 |
| `/` | `App`（重构） | 首页（看板/列表） |

### 3.2 App.jsx 重构

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 4. 组件设计

### 4.1 新增组件

| 组件 | 文件 | 职责 |
|------|------|------|
| `ProjectDetailPage` | `pages/ProjectDetailPage.jsx` | 项目详情页容器 |
| `MilestoneTimeline` | `components/MilestoneTimeline.jsx` | 里程碑时间线 |
| `MilestoneCard` | `components/MilestoneCard.jsx` | 里程碑卡片 |
| `MilestoneForm` | `components/MilestoneForm.jsx` | 里程碑表单 |
| `ProjectInfo` | `components/ProjectInfo.jsx` | 项目信息展示 |

### 4.2 现有组件修改

| 组件 | 修改内容 |
|------|----------|
| `ProjectCard` | 添加点击跳转到 `/project/:id` |
| `App.jsx` | 添加 React Router，拆分 HomePage |
| `useGitHub` | 扩展支持 v3 格式读写 |

## 5. 功能实现

### 5.1 项目详情页 (`/project/:id`)

```
返回按钮 → HomePage

┌─────────────────────────────────────────────┐
│ 项目名称                        [编辑项目]  │
│ 描述                                          │
│ 创建: YYYY-MM-DD | 更新: YYYY-MM-DD          │
├─────────────────────────────────────────────┤
│ 里程碑进度                                   │
│ ●────────●─────────○─────────○               │
│ 阶段1    阶段2(当前)  阶段3     阶段4        │
├─────────────────────────────────────────────┤
│ [+ 添加里程碑]                                │
├─────────────────────────────────────────────┤
│ 关联提案 (N个)                               │
│ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ P-XXX  │ │ P-XXX  │ │ P-XXX  │ ...        │
│ └────────┘ └────────┘ └────────┘            │
└─────────────────────────────────────────────┘
```

### 5.2 里程碑时间线

- 水平时间线展示
- 节点状态颜色：
  - `pending`：灰色圆圈
  - `in_progress`：蓝色圆圈（脉冲动画）
  - `completed`：绿色实心圆圈
- 点击节点展开详情
- 支持拖拽调整顺序（可选，P2）

### 5.3 里程碑 CRUD

- **创建**：点击「添加里程碑」→ 弹出 MilestoneForm
- **编辑**：点击里程碑卡片 → 弹出 MilestoneForm（预填充）
- **删除**：在编辑弹窗中点击删除按钮
- **状态切换**：下拉选择状态

### 5.4 提案关联里程碑

- 在里程碑表单中通过多选框选择关联提案
- 提案列表按项目筛选
- 支持一个提案关联多个里程碑

## 6. 数据迁移

### 6.1 迁移脚本

```javascript
function migrateToV3(data) {
  // 如果已是 v3，直接返回
  if (data.version === 3) return data;

  // 为每个项目添加空 milestones 数组
  const projects = (data.projects || []).map(p => ({
    ...p,
    milestones: p.milestones || []
  }));

  return {
    version: 3,
    projects,
    proposals: data.proposals || []
  };
}
```

### 6.2 迁移时机

- 首次加载数据时检测
- 检测到旧版本时自动迁移并保存

## 7. 文件结构

```
src/
├── App.jsx                 # 路由配置
├── main.jsx
├── index.css
├── pages/
│   └── ProjectDetailPage.jsx   # 新增
├── components/
│   ├── Header.jsx
│   ├── SearchBar.jsx
│   ├── FilterBar.jsx
│   ├── ProposalCard.jsx
│   ├── ProposalForm.jsx
│   ├── ProjectCard.jsx
│   ├── ProjectForm.jsx
│   ├── ProjectProposalList.jsx
│   ├── MilestoneTimeline.jsx   # 新增
│   ├── MilestoneCard.jsx       # 新增
│   └── MilestoneForm.jsx       # 新增
└── hooks/
    └── useGitHub.js            # 扩展 v3 支持
```

## 8. 验收标准

- [ ] React Router 路由正常切换
- [ ] `/project/:id` 正确渲染项目详情
- [ ] 里程碑 CRUD 功能完整
- [ ] 时间线展示正确
- [ ] 数据迁移平滑（无数据丢失）
- [ ] GitHub API 保存/读取正常
- [ ] 首页和详情页导航正常

## 9. 优先级

1. **P0**：路由 + 页面框架 + 数据加载
2. **P1**：里程碑 CRUD + 时间线展示
3. **P2**：提案与里程碑关联
4. **P3**：数据迁移

## 10. Technical Expectations 确认

- **技术栈**：React 18 + Vite 5 + Tailwind CSS 3 + React Router v6
- **技术方案**：本文档
- **确认方式**：boss 确认后进入开发
- **超时规则**：5 分钟无响应默认通过

## 11. Timeout Resolution

- **状态**：timeout-approved
- **原因**：技术期望确认倒计时到期(2026-05-02)，无响应，按规则默认通过
- **处理时间**：2026-05-02
