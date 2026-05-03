import { Link, useLocation } from 'react-router-dom';

function Header({ onAdd, onSettings, darkMode, onToggleDarkMode, projectName }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path) => {
    const base = 'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors';
    return isActive(path)
      ? `${base} bg-blue-500 text-white`
      : `${base} bg-gray-500 text-white hover:bg-gray-600`;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {projectName ? (
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {projectName}
            </span>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">项目提案管理</h1>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/" className={navLinkClass('/')}>
            列表
          </Link>
          <Link to="/kanban" className={navLinkClass('/kanban')}>
            看板
          </Link>
          <Link to="/gantt" className={navLinkClass('/gantt')}>
            甘特图
          </Link>
          <Link to="/dashboard" className={navLinkClass('/dashboard')}>
            统计
          </Link>
          <button
            onClick={onToggleDarkMode}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            onClick={onAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <span>+</span> 添加提案
          </button>
          <button
            onClick={onSettings}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            设置
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
