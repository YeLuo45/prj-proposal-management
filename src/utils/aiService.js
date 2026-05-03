// src/utils/aiService.js
const API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

export async function classifyProposal(description, apiKey) {
  if (!apiKey || !description) return { type: 'web', tags: [] };

  const prompt = `分析以下提案描述，判断：
1. 项目类型（type）：web（网站）、app（移动应用）、package（工具/库）
2. 推荐标签（tags）：从以下列表中选择最相关的标签（最多3个）
可选标签：Web, React, Vue, Angular, Node.js, Python, Java, Go, Rust, Mobile, iOS, Android, API, Database, DevOps, AI, ML, Frontend, Backend, Fullstack, UI/UX, Security, Performance, Testing, CI/CD, Docker, Kubernetes, Cloud, SaaS, B2B, B2C, Consumer, Enterprise, Open Source

只返回 JSON 格式：{"type": "web", "tags": ["React", "Frontend"]}
描述：${description}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{"type":"web","tags":[]}';
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch (err) {
    console.error('AI classify failed:', err);
    return { type: 'web', tags: [] };
  }
}

export async function generateSummary(description, apiKey) {
  if (!apiKey || description.length <= 50) return '';

  const prompt = `将以下提案描述压缩为一句话摘要（不超过 30 字）：
${description}
只返回摘要文字，不要解释。`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('AI summary failed:', err);
    return '';
  }
}

export function getAPIKey() {
  return localStorage.getItem('ai_api_key') || '';
}

export function setAPIKey(key) {
  localStorage.setItem('ai_api_key', key);
}
