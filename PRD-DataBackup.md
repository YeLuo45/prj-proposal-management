# PRD: 数据导出/备份 + 全局搜索

## 功能一：数据导出/备份

### 背景
当前提案数据只存储在 GitHub（data/proposals.json, data/milestones.json），用户没有本地备份手段。需要提供一键导出和导入恢复功能。

### 触发入口
Header 右侧新增导出按钮（下载图标），点击展开下拉菜单：
- 「导出数据备份」
- 「导入数据」

### 导出流程
1. 用户点击「导出数据备份」
2. 显示 loading 提示「正在准备备份...」
3. 并发请求 GitHub API 获取：
   - `data/proposals.json`（完整内容）
   - `data/milestones.json`（完整内容）
4. 生成 `backup-{YYYYMMDD-HHmmss}.json`，内容结构：
   ```json
   {
     "version": "1.0",
     "exportedAt": "2026-05-04T12:00:00.000Z",
     "data": {
       "proposals": { /* 原始 proposals.json */ },
       "milestones": { /* 原始 milestones.json */ }
     }
   }
   ```
5. 使用 JSZip 生成 `.zip` 文件
6. 触发浏览器下载：`proposals-backup-{date}.zip`
   - 包含 `backup.json` + 原始 `proposals.json` + `milestones.json`

### 导入流程
1. 用户点击「导入数据」→ 打开导入 Modal
2. 用户选择本地 `.zip` 文件（或拖拽上传）
3. 解析 zip，验证结构（必须有 backup.json）
4. 预览变更：
   - 对比「当前」vs「导入」提案数量、里程碑数量
   - 列出新增/删除/修改的提案 ID 列表
5. 用户确认后：
   - 写入 GitHub（PUT proposals.json + milestones.json）
   - 触发 SyncContext 刷新
6. 成功提示「已导入 N 个提案，M 个里程碑」

### 错误处理
- GitHub token 未配置：提示去设置页面配置
- 网络请求失败：toast 错误提示
- zip 格式无效：提示「文件格式错误」
- 导入数据为空：提示「备份文件内容为空」

---

## 功能二：全局搜索 (Cmd+K)

### 触发方式
1. **快捷键**：`Cmd+K`（Mac）/ `Ctrl+K`（Windows/Linux）
2. **Header 按钮**：搜索图标按钮，点击打开搜索 Modal

### 搜索范围
- proposals：id、title、description、status、tags、projectId
- milestones：id、title、description、status
- 实时搜索（debounce 150ms），最小 1 字符触发

### 搜索 Modal UI
- 居中浮层，背景遮罩（点击关闭）
- 输入框：占位符「搜索提案和里程碑...」
- 结果列表：分两个 Tab「提案」「里程碑」
- 每条结果显示：类型图标 + 标题 + 状态标签 + 所属项目
- 键盘导航：
  - `↑↓`：上下选择
  - `Enter`：跳转到详情
  - `Escape`：关闭 Modal
- 最近搜索：最近 5 条保存在 localStorage

### 跳转到详情
- 提案 → `#/project/{projectId}?proposal={id}`
- 里程碑 → `#/gantt?highlight={id}`

### 空状态
- 无搜索词：显示「最近搜索」和「快捷操作」（新建提案等）
- 无结果：显示「未找到匹配的提案或里程碑」

---

## 技术方案

### 新增文件
- `src/components/ExportBackupModal.jsx` — 导入 Modal（预览 + 确认）
- `src/components/GlobalSearch.jsx` — 搜索 Modal
- `src/services/backupService.js` — 导出/导入核心逻辑（JSZip）
- `src/hooks/useGlobalSearch.js` — 搜索逻辑和快捷键绑定

### 修改文件
- `src/components/Header.jsx` — 添加导出按钮和搜索触发按钮
- `src/App.jsx` — 挂载 GlobalSearch 组件（全局浮层）
- `package.json` — 添加 `jszip` 依赖

### 依赖
- `jszip` — zip 生成和解析

### 快捷键
- `Cmd+K` / `Ctrl+K` → 打开全局搜索
- `Escape` → 关闭 Modal
- 全局注册，不需要在每个页面单独处理

### 状态管理
- GlobalSearch 使用 React Portal 渲染到 body
- 搜索状态（open/closed）在 useGlobalSearch hook 内部管理
- 导出状态由 backupService 管理
