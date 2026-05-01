import { Link } from 'react-router-dom';

function Header({ onAdd, onSettings }) {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">提案管理系统</h1>
        <div className="flex gap-4">
          <Link
            to="/todos"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            看板视图
          </Link>
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
