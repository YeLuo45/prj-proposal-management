/**
 * CommentService - V20 Collaboration Enhancement
 * Manages comments for proposals, milestones, and projects
 */

const COMMENTS_KEY = 'proposals_comments_v2';

/**
 * Get all comments
 */
function getComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Save comments to localStorage
 */
function saveComments(comments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

/**
 * Get comments for a specific entity
 * @param {string} entityType - 'proposal' | 'milestone' | 'project'
 * @param {string} entityId - The entity ID
 */
export function getEntityComments(entityType, entityId) {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  return comments[key] || [];
}

/**
 * Get all comments for a project (across all entities)
 */
export function getProjectComments(projectId) {
  const comments = getComments();
  const result = [];
  
  Object.keys(comments).forEach(key => {
    const entityComments = comments[key];
    entityComments.forEach(comment => {
      if (comment.projectId === projectId) {
        result.push({
          ...comment,
          entityKey: key,
        });
      }
    });
  });
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Add a comment to an entity
 */
export function addComment(entityType, entityId, content, author = 'User') {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  
  if (!comments[key]) {
    comments[key] = [];
  }
  
  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType,
    entityId,
    content,
    author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectId: null, // Will be set by caller if needed
    replies: [],
    likes: 0,
  };
  
  comments[key].push(newComment);
  saveComments(comments);
  
  return newComment;
}

/**
 * Update a comment
 */
export function updateComment(entityType, entityId, commentId, content) {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  
  if (!comments[key]) return null;
  
  const commentIndex = comments[key].findIndex(c => c.id === commentId);
  if (commentIndex === -1) return null;
  
  comments[key][commentIndex] = {
    ...comments[key][commentIndex],
    content,
    updatedAt: new Date().toISOString(),
  };
  
  saveComments(comments);
  return comments[key][commentIndex];
}

/**
 * Delete a comment
 */
export function deleteComment(entityType, entityId, commentId) {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  
  if (!comments[key]) return false;
  
  const initialLength = comments[key].length;
  comments[key] = comments[key].filter(c => c.id !== commentId);
  
  if (comments[key].length < initialLength) {
    saveComments(comments);
    return true;
  }
  
  return false;
}

/**
 * Add a reply to a comment
 */
export function addReply(entityType, entityId, commentId, content, author = 'User') {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  
  if (!comments[key]) return null;
  
  const comment = comments[key].find(c => c.id === commentId);
  if (!comment) return null;
  
  const reply = {
    id: `rpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    author,
    createdAt: new Date().toISOString(),
  };
  
  if (!comment.replies) {
    comment.replies = [];
  }
  comment.replies.push(reply);
  
  saveComments(comments);
  return reply;
}

/**
 * Toggle like on a comment
 */
export function toggleLike(entityType, entityId, commentId, userId = 'anonymous') {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  
  if (!comments[key]) return null;
  
  const comment = comments[key].find(c => c.id === commentId);
  if (!comment) return null;
  
  if (!comment.likedBy) {
    comment.likedBy = [];
  }
  
  const likeIndex = comment.likedBy.indexOf(userId);
  if (likeIndex === -1) {
    comment.likedBy.push(userId);
    comment.likes = (comment.likes || 0) + 1;
  } else {
    comment.likedBy.splice(likeIndex, 1);
    comment.likes = Math.max(0, (comment.likes || 0) - 1);
  }
  
  saveComments(comments);
  return comment;
}

/**
 * Get comment count for an entity
 */
export function getCommentCount(entityType, entityId) {
  const comments = getEntityComments(entityType, entityId);
  return comments.length;
}

/**
 * Get total comment count for a project
 */
export function getProjectCommentCount(projectId) {
  return getProjectComments(projectId).length;
}

/**
 * Delete all comments for an entity
 */
export function deleteEntityComments(entityType, entityId) {
  const comments = getComments();
  const key = `${entityType}_${entityId}`;
  delete comments[key];
  saveComments(comments);
}

/**
 * Delete all comments for a project
 */
export function deleteProjectComments(projectId) {
  const allComments = getComments();
  const filtered = {};
  
  Object.keys(allComments).forEach(key => {
    const entityComments = allComments[key].filter(c => c.projectId !== projectId);
    if (entityComments.length > 0) {
      filtered[key] = entityComments;
    }
  });
  
  saveComments(filtered);
}

export default {
  getEntityComments,
  getProjectComments,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  toggleLike,
  getCommentCount,
  getProjectCommentCount,
  deleteEntityComments,
  deleteProjectComments,
};
