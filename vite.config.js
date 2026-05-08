import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// 获取当前 git commit hash
function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// 获取构建时间
function getBuildTime() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

export default defineConfig({
  plugins: [react()],
  // inject version constants via define (replaced at build time)
  define: {
    __APP_VERSION__: JSON.stringify('1.0.1'),
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
  },
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
        },
      },
    },
    // 调整警告阈值，因为拆包后单个chunk会更小
    chunkSizeWarningLimit: 300,
  },
})
