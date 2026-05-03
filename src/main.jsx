import React from 'react'
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import KanbanSwimlanes from './pages/KanbanSwimlanes.jsx'
import GanttView from './pages/GanttView.jsx'
import DashboardView from './pages/DashboardView.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/kanban" element={<KanbanSwimlanes />} />
        <Route path="/kanban/:projectId" element={<KanbanSwimlanes />} />
        <Route path="/gantt" element={<GanttView />} />
        <Route path="/dashboard" element={<DashboardView />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
