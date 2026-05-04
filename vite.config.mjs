import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React核心
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 图表库 - 体积大，单独拆包
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          // Markdown处理
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          // DnD Kit拖拽库
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // highlight.js语法高亮
          'highlight-vendor': ['highlight.js'],
          // 页面组件懒加载 chunks
          'page-dashboard': ['./pages/DashboardView.jsx'],
          'page-gantt': ['./pages/GanttView.jsx'],
          'page-kanban': ['./pages/KanbanSwimlanes.jsx'],
          'page-project': ['./pages/ProjectDetailPage.jsx'],
          'page-marketplace': ['./components/TemplateMarketplace.jsx'],
        },
      },
    },
    // 调整警告阈值，因为拆包后单个chunk会更小
    chunkSizeWarningLimit: 300,
  },
})
