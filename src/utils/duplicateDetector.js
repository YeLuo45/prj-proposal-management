// src/utils/duplicateDetector.js

const STOP_WORDS = new Set([
  '的', '了', '和', '与', '或', '在', '是', '我', '你', '他', '这', '那',
  '个', '为', '以及', '等', '于', '上', '下', '中', '可', '能', '需要', '实现', '功能', '支持', '提供', '用户', '使用', '进行',
]);

function extractKeywords(text) {
  const words = text.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g) || [];
  return words.filter(w => w.length > 1 && !STOP_WORDS.has(w)).slice(0, 20);
}

function cosineSimilarity(a, b) {
  if (!a.length || !b.length) return 0;
  const set = new Set([...a, ...b]);
  const vec = (arr) => Array.from(set).map(w => arr.includes(w) ? 1 : 0);
  const v1 = vec(a), v2 = vec(b);
  const dot = v1.reduce((s, v, i) => s + v * v2[i], 0);
  const mag = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (mag(v1) * mag(v2));
}

export function findDuplicates(proposal, existingProposals, threshold = 0.6) {
  if (!proposal.description) return [];

  const keywords = extractKeywords(proposal.description);
  const results = [];

  existingProposals.forEach(existing => {
    if (existing.id === proposal.id) return;
    if (!existing.description) return;
    const existingKeywords = extractKeywords(existing.description);
    const sim = cosineSimilarity(keywords, existingKeywords);
    if (sim >= threshold) {
      results.push({
        proposal: existing,
        similarity: Math.round(sim * 100),
      });
    }
  });

  return results.sort((a, b) => b.similarity - a.similarity);
}
