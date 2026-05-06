# PRD: prj-proposals-manager 首页UI优化

## 目标
精简Header，移除非必要功能，将这些功能统一迁移到设置页（/settings）

## 当前问题
Header功能过于臃肿，包含过多操作按钮：
- LanguageSwitcher（可移到设置）
- ThemeSwitcher（可移到设置）
- 深色模式切换（重复，与ThemeSwitcher功能重叠）
- 导出下拉菜单（可移到设置）
- 历史按钮（可移到设置）
- 快捷键按钮（可移到设置）
- 通知按钮（可移到设置）
- 设置按钮（导航栏和Header各有一个，重复）

## 优化方案

### Header保留的核心功能
1. **导航链接**：列表、看板、甘特图、数据统计、模板市场、设置
2. **搜索按钮**（Cmd+K）
3. **添加提案按钮**
4. **通知图标**（保留，快速访问）

### 迁移到设置页的功能
1. LanguageSwitcher → 设置页
2. ThemeSwitcher → 设置页
3. 导出/导入 → 设置页已有 ImportExportPanel
4. 历史记录 → 设置页
5. 快捷键 → 设置页已有
6. 深色模式切换 → 由 ThemeSwitcher 替代

### 设置页入口
- 导航栏只保留一个"设置"链接（移除Header中的重复按钮）

## 实施步骤
1. 移除Header中的 LanguageSwitcher, ThemeSwitcher, 导出下拉, 历史按钮, 快捷键按钮, 重复的设置按钮
2. 保留搜索、通知、添加提案
3. 设置页已完整，无需修改

## 验收标准
- Header只显示核心功能
- 设置页包含所有迁移的功能
- 跳转链接正常
