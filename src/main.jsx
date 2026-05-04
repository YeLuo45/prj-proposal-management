import React from 'react'
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css'
import './i18n.js';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { SyncProvider } from './contexts/SyncContext.jsx';
import BottomNav from './components/BottomNav.jsx';

// 路由懒加载 - 按需加载页面组件，减小首屏JS体积
const KanbanSwimlanes = React.lazy(() => import('./pages/KanbanSwimlanes.jsx'));
const GanttView = React.lazy(() => import('./pages/GanttView.jsx'));
const DashboardView = React.lazy(() => import('./pages/DashboardView.jsx'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage.jsx'));
const TemplateMarketplace = React.lazy(() => import('./components/TemplateMarketplace.jsx'));

// 懒加载loading组件
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

function AppWithBottomNav() {
  return (
    <>
      <BottomNav />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/kanban" element={<KanbanSwimlanes />} />
        <Route path="/kanban/:projectId" element={<KanbanSwimlanes />} />
        <Route path="/gantt" element={<GanttView />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/marketplace" element={<TemplateMarketplace />} />
      </Routes>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SyncProvider>
        <HashRouter>
          <React.Suspense fallback={<LoadingFallback />}>
            <AppWithBottomNav />
          </React.Suspense>
        </HashRouter>
      </SyncProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
