import { useState, useEffect } from 'react'

export default function SearchBar({ value, onChange }) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(t)
  }, [local, onChange])

  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      placeholder="🔍 搜索名称、描述或标签..."
      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
    />
  )
}
