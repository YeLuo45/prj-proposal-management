import { useState, useEffect } from 'react'

const DATA_FILE = 'data/proposals.json'
const INITIAL_DATA = {
  proposals: [
    {
      id: 'P-20250416-002',
      name: 'game-1024',
      description: '经典1024玩法（4×4滑动合并，目标1024）+ PWA可安装到安卓主屏幕 + 存档/继续游戏 + 皮肤系统',
      type: 'package',
      status: 'active',
      url: 'https://yeluo45.github.io/game-1024/',
      packageUrl: '',
      tags: ['游戏', 'PWA', '1024'],
      createdAt: '2026-04-16',
      updatedAt: '2026-04-17',
    },
    {
      id: 'P-20250416-001',
      name: 'todo-app',
      description: 'Web版 TodoList（含 Windows 客户端扩展）',
      type: 'web',
      status: 'active',
      url: 'https://yeluo45.github.io/hermes-agent/',
      packageUrl: '',
      tags: ['TodoList', 'Web', 'PWA'],
      createdAt: '2026-04-16',
      updatedAt: '2026-04-16',
    },
    {
      id: 'P-20250416-003',
      name: 'calculator-app',
      description: 'React Native 安卓计算器 — 科学计算 + 单位转换 + 汇率换算',
      type: 'app',
      status: 'in_dev',
      url: '',
      packageUrl: '',
      tags: ['React Native', 'Android', '计算器'],
      createdAt: '2026-04-16',
      updatedAt: '2026-04-16',
    },
  ],
}

function getStoredToken() {
  try {
    return localStorage.getItem('gh_pat') || ''
  } catch {
    return ''
  }
}

async function getFileSha(api, token, owner, repo, path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (res.ok) {
      const data = await res.json()
      return data.sha
    }
  } catch {}
  return null
}

export function useGitHub({ owner, repo, path }) {
  const [token, setTokenState] = useState(getStoredToken)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setToken = (t) => {
    try {
      localStorage.setItem('gh_pat', t)
      setTokenState(t)
    } catch {}
  }

  const clearError = () => setError('')

  const saveData = async (newData) => {
    if (!token) {
      setError('请先配置 GitHub Token')
      return
    }
    setLoading(true)
    setError('')
    try {
      const content = JSON.stringify(newData, null, 2)
      const sha = await getFileSha(null, token, owner, repo, path)
      const body = {
        message: `Update ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
      }
      if (sha) body.sha = sha

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || '保存失败')
      }
      setData(newData)
    } catch (e) {
      setError(`保存失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
      .then(r => {
        if (!r.ok) {
          if (r.status === 404) return INITIAL_DATA
          throw new Error(`加载失败: ${r.status}`)
        }
        return r.json()
      })
      .then(async (result) => {
        if (result === INITIAL_DATA) {
          // File doesn't exist, initialize it
          await saveData(INITIAL_DATA)
        } else {
          const content = JSON.parse(decodeURIComponent(escape(atob(result.content))))
          setData(content)
        }
      })
      .catch(e => {
        setError(`加载失败: ${e.message}`)
        setData(INITIAL_DATA)
      })
      .finally(() => setLoading(false))
  }, [token, owner, repo, path])

  return { token, setToken, data, saveData, loading, error, clearError }
}
