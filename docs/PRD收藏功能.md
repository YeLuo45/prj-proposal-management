# 收藏功能 PRD 文档

> 项目：prj-proposals-manager  
> 版本：v1.0  
> 日期：2026-05-18  
> 状态：**已完成基础实现，待增强**

---

## 一、现有代码结构分析

### 1.1 核心数据类型

网站存在两套数据结构：

#### 提案 (Proposal)
- 存储位置：`/data/proposals.json`（196KB，当前生产数据）
- 结构：`{ version: 3, projects: [...] }`（Tree 格式 v2 或 Flat 格式 v3）
- 提案字段：`id`, `name`, `description`, `type`, `status`, `tags`, `gitRepo`, `url`, `owner`, `createdAt`, `updatedAt`, `deadline` 等

#### 项目 (Project)
- 每个 Project 包含嵌套的 `proposals[]` 数组
- 项目级字段：`id`, `name`, `description`, `url`, `gitRepo`, `githubPages`

#### 其他数据
- `data/milestones.json`（2.6KB）
- `data/todos.json`（90KB，看板待办事项）
- `data/favorites.json`（54B，当前为空对象）

### 1.2 组件架构

| 组件 | 文件 | 职责 |
|------|------|------|
| **ProjectCard** | `src/components/ProjectCard.jsx` | 项目卡片，含收藏按钮 ⭐/📌 |
| **ProposalCard** | `src/components/ProposalCard.jsx` | 提案卡片（无收藏功能） |
| **Header** | `src/components/Header.jsx` | 顶部导航 |
| **FilterBar** | `src/components/FilterBar.jsx` | 筛选栏，含 viewMode 切换 |
| **useFavorites** | `src/hooks/useFavorites.js` | 收藏状态管理 Hook |

### 1.3 页面结构

| 页面 | 文件 | 路由 |
|------|------|------|
| 主列表页 | `src/App.jsx` | `/` |
| 看板视图 | `src/pages/KanbanBoard.jsx` | `/kanban` |
| 甘特图 | `src/pages/GanttView.jsx` | `/gantt` |
| 仪表盘 | `src/pages/DashboardView.jsx` | `/dashboard` |
| 项目详情 | `src/pages/ProjectDetailPage.jsx` | `/project/:id` |

### 1.4 数据同步机制

- **GitHub API**：`src/services/githubApi.js`（V21）
  - 配置：`owner=YeLuo45`, `repo=prj-proposals-manager`, `branch=master`
  - 读写 `data/` 目录下的 JSON 文件（proposals.json, milestones.json, todos.json）
  - 使用 `PUT /repos/{owner}/{repo}/contents/{path}` 写文件（需要 SHA 校验）

- **SyncContext**：`src/contexts/SyncContext.jsx`（V25）
  - 管理同步状态、同步间隔、Token 验证
  - 支持自动同步和手动触发

- **useGitHub Hook**：`src/hooks/useGitHub.js`
  - 提供 `fetchProposals()` 和 `saveProposals()` 方法

---

## 二、现有收藏功能分析

### 2.1 已实现的功能

**`useFavorites` Hook**（`src/hooks/useFavorites.js`）已实现：

```javascript
// 数据结构
favorites = {
  "PRJ-001": { timestamp: "2026-05-18T12:00:00Z", pinned: true },
  "PRJ-002": "2026-05-17T10:00:00Z",  // 旧格式，纯时间戳
}

// 核心方法
- fetchFavorites()      // 从 GitHub 读取 favorites.json（含 5 分钟缓存）
- toggleFavorite(id)     // 添加/移除收藏
- pinFavorite(id)       // 置顶/取消置顶
- refreshFavorites()    // 强制刷新
```

**存储位置**：`data/favorites.json`（GitHub 仓库文件）

```json
{
  "favorites": {},
  "updatedAt": "2026-05-12T00:00:00Z"
}
```

### 2.2 UI 入口

**ProjectCard** 已集成收藏 UI：
- ⭐ 按钮（右上角）→ `toggleFavorite`
- 📌 按钮（⭐ 左侧，已收藏时显示）→ `pinFavorite`
- 支持多选模式（批量操作）

### 2.3 现有问题

| 问题 | 描述 |
|------|------|
| **提案无法收藏** | 现有只支持收藏 Project（项目），无法单独收藏 Proposal（提案） |
| **UI 不统一** | ProposalCard 没有收藏按钮 |
| **无收藏视图** | 主页面 `showFavoritesOnly` 只能过滤项目级别的收藏 |
| **PIN 功能不完善** | `favoritesFilteredProjects` 排序时 pinned 未优先 |

---

## 三、收藏功能增强方案

### 3.1 需求分析

| 需求 | 优先级 | 说明 |
|------|--------|------|
| 收藏对象扩展 | **高** | 支持提案（Proposal）级别收藏 |
| 收藏 UI 补全 | **高** | 在 ProposalCard 和 KanbanCard 添加收藏按钮 |
| 收藏视图优化 | **中** | 添加独立的收藏页面/标签页 |
| 多维度筛选 | **中** | 支持按"项目收藏"或"提案收藏"筛选 |

### 3.2 数据结构设计

#### 方案 A：统一 ID 前缀（推荐）

```javascript
favorites = {
  // 项目收藏
  "PRJ-001": { timestamp: "2026-05-18T12:00:00Z", pinned: true, type: "project" },
  "PRJ-002": { timestamp: "2026-05-17T10:00:00Z", pinned: false, type: "project" },
  
  // 提案收藏
  "PROP-2025-001": { timestamp: "2026-05-18T12:00:00Z", pinned: false, type: "proposal" },
  "PROP-2025-002": { timestamp: "2026-05-17T10:00:00Z", pinned: true, type: "proposal" },
}

// 类型自动推断：ID 以 "PRJ-" 开头为项目，"PROP-" 或 "p-" 开头为提案
```

**优点**：向后兼容，现有代码改动最小  
**缺点**：需要前端约定 ID 格式

#### 方案 B：分离字段

```javascript
favorites = {
  projects: {
    "PRJ-001": { timestamp: "...", pinned: true },
  },
  proposals: {
    "PROP-001": { timestamp: "...", pinned: false },
  }
}
```

**优点**：类型安全，筛选性能高  
**缺点**：改动较大，需要修改 `useFavorites` 和所有调用处

### 3.3 存储方案

**当前方案已确定：GitHub 仓库文件**

- 文件路径：`data/favorites.json`
- 同步方式：通过 GitHub REST API `PUT /repos/{owner}/{repo}/contents/data/favorites.json`
- Token：使用现有的 GitHub Token（`VITE_GH_TOKEN` 或 `localStorage.github_token`）
- 缓存：5 分钟本地缓存 + 乐观更新

**结论：无需修改存储方案，复用现有实现**

### 3.4 组件改造

#### 3.4.1 ProposalCard 改造

```jsx
// 在卡片右上角添加收藏按钮（与 ProjectCard 一致）
<button
  onClick={() => onToggleFavorite(proposal.id)}
  className="absolute top-3 right-8 text-xl hover:scale-110 transition-transform"
>
  {isFavorite ? '⭐' : '☆'}
</button>

{isFavorite && (
  <button
    onClick={() => onPinFavorite(proposal.id)}
    className={`absolute top-3 right-3 text-xl ...`}
  >
    {isPinned ? '📌' : '📍'}
  </button>
)}
```

#### 3.4.2 KanbanCard 改造

在 `src/components/KanbanCard.jsx`（如果存在）添加类似收藏 UI

#### 3.4.3 App.jsx 改造

```jsx
// 添加提案收藏相关状态传递
<ProposalCard
  proposal={proposal}
  favorites={favorites}           // 传入收藏状态
  onToggleFavorite={toggleFavorite}
  onPinFavorite={pinFavorite}
  // ...其他 props
/>
```

### 3.5 筛选逻辑改造

```jsx
// 收藏过滤增强
const favoritesFilteredProposals = useMemo(() => {
  if (!showFavoritesOnly) return focusFilteredProposals;
  const favIds = new Set(Object.keys(favorites));
  return focusFilteredProposals.filter(p => favIds.has(p.id));
}, [focusFilteredProposals, favorites, showFavoritesOnly]);

// 收藏类型筛选
const [favoriteFilter, setFavoriteFilter] = useState('all'); // 'all' | 'projects' | 'proposals'
```

---

## 四、实现计划

### Phase 1：基础增强（1-2 天）

| 任务 | 负责 | 说明 |
|------|------|------|
| 修改 `useFavorites` 支持提案收藏 | 前端 | 统一数据结构，自动识别类型 |
| ProposalCard 添加收藏按钮 | 前端 | 复用 ProjectCard 的 UI 模式 |
| App.jsx 传递收藏 props | 前端 | 将 favorites/toggleFavorite 传给 ProposalCard |

### Phase 2：体验优化（2-3 天）

| 任务 | 负责 | 说明 |
|------|------|------|
| 收藏视图添加类型筛选 Tab | 前端 | 全部 / 项目收藏 / 提案收藏 |
| 收藏列表按类型分组展示 | 前端 | 分区块显示项目/提案 |
| 看板页面添加收藏功能 | 前端 | 参照 ProposalCard |

### Phase 3：数据迁移（0.5 天）

| 任务 | 负责 | 说明 |
|------|------|------|
| favorites.json 数据迁移脚本 | DevOps | 将旧的纯时间戳格式升级为对象格式 |
| 兼容性处理 | 前端 | 兼容旧格式（字符串时间戳） |

---

## 五、技术细节

### 5.1 useFavorites API 扩展

```typescript
interface FavoriteItem {
  timestamp: string;    // ISO 8601 时间
  pinned: boolean;      // 是否置顶
  type?: 'project' | 'proposal';  // 可选，自动推断
}

interface UseFavoritesReturn {
  favorites: Record<string, FavoriteItem>;
  favoritesList: FavoriteItem[];
  loading: boolean;
  toggleFavorite: (id: string) => Promise<void>;
  pinFavorite: (id: string) => Promise<void>;
  refreshFavorites: (force?: boolean) => Promise<void>;
  
  // 新增方法
  getFavoritesByType: (type: 'project' | 'proposal') => FavoriteItem[];
  isFavorite: (id: string) => boolean;
  isPinned: (id: string) => boolean;
}
```

### 5.2 GitHub API 调用（复用现有）

```javascript
// 复用 githubApi.js 的模式
const FAVORITES_URL = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/favorites.json`;

// 读取
const response = await fetch(`${FAVORITES_URL}?ref=${BRANCH}`, { headers });

// 写入（需要 SHA）
await fetch(FAVORITES_URL, {
  method: 'PUT',
  body: JSON.stringify({ message: `Update favorites`, content, sha, branch: BRANCH })
});
```

### 5.3 乐观更新策略

1. 用户点击收藏 → 立即更新本地状态 + 缓存
2. 后台发起 GitHub API 请求
3. 成功 → 无操作
4. 失败 → 回滚本地状态 + 显示 toast 错误

---

## 六、现有功能参考

### 6.1 相关文件

| 文件路径 | 说明 |
|----------|------|
| `src/hooks/useFavorites.js` | 收藏状态管理（已实现） |
| `src/components/ProjectCard.jsx` | 项目卡片（含收藏 UI 参考） |
| `src/components/ProposalCard.jsx` | 提案卡片（待添加收藏） |
| `src/services/githubApi.js` | GitHub API 封装 |
| `src/contexts/SyncContext.jsx` | 同步上下文 |
| `src/App.jsx` | 主页面（收藏逻辑集成点） |

### 6.2 已有的 UI 组件

- 收藏按钮样式：`absolute top-3 right-8 text-xl hover:scale-110 transition-transform`
- 置顶按钮样式：`absolute top-3 right-3 text-xl hover:scale-110 transition-transform`
- Emoji：⭐（未收藏）/ ☆（收藏）/ 📌（已置顶）/ 📍（未置顶）

---

## 七、风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| 并发冲突 | GitHub API 需要 SHA，每个用户独立文件 |
| Token 失效 | 前端检查 token 有效性，401 时提示重新配置 |
| 离线使用 | 乐观更新 + 本地缓存，网络恢复后自动同步 |
| 大数据量 | favorites.json 预计很小（纯 ID 列表），无性能问题 |

---

## 八、结论

**收藏功能已完成基础实现**，核心机制（GitHub 存储、乐观更新、置顶功能）已就绪。

**下一步工作**主要是：
1. 将收藏能力从 Project 扩展到 Proposal
2. 在 ProposalCard 等组件补全收藏 UI
3. 优化收藏视图的筛选体验

所有改造均可在不改变现有存储方案的前提下完成。