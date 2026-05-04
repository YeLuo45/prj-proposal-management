/**
 * GitHub API Service - V21
 * Enhanced GitHub API integration with proper error handling, rate limit management,
 * and support for multiple data files (proposals, milestones, todos)
 */

const GITHUB_API_BASE = 'https://api.github.com';

// Default configuration
const DEFAULT_CONFIG = {
  owner: 'YeLuo45',
  repo: 'prj-proposals-manager',
  branch: 'master',
  dataPath: 'data',
};

class GitHubApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.response = response;
  }
}

class RateLimitError extends GitHubApiError {
  constructor(resetTime) {
    super('GitHub API rate limit exceeded', 403, null);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

class GitHubApiService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.token = null;
    this.lastSyncTime = null;
    this.syncStatus = 'idle'; // idle | syncing | success | error
    this.listeners = new Set();
  }

  /**
   * Configure the API service
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the GitHub token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      localStorage.removeItem('github_token');
    }
    this.notifyListeners();
  }

  /**
   * Get stored token from localStorage
   */
  loadToken() {
    this.token = localStorage.getItem('github_token');
    return this.token;
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Build API URL for a file
   */
  buildFileUrl(filePath, ref = null) {
    const { owner, repo, branch } = this.config;
    const basePath = `repos/${owner}/${repo}/contents/${filePath}`;
    const suffix = ref ? `?ref=${ref}` : '';
    return `${GITHUB_API_BASE}/${basePath}${suffix}`;
  }

  /**
   * Check if token is configured
   */
  hasToken() {
    return !!this.token;
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus, this.lastSyncTime));
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Set sync status
   */
  setStatus(status) {
    this.syncStatus = status;
    this.notifyListeners();
  }

  /**
   * Handle API response and errors
   */
  async handleResponse(response) {
    if (response.status === 401) {
      throw new GitHubApiError('Invalid or expired GitHub token', 401, null);
    }
    if (response.status === 403) {
      const resetHeader = response.headers.get('X-RateLimit-Reset');
      if (resetHeader) {
        const resetTime = new Date(parseInt(resetHeader) * 1000);
        throw new RateLimitError(resetTime);
      }
      throw new GitHubApiError('Access forbidden - rate limit may be exceeded', 403, null);
    }
    if (response.status === 404) {
      throw new GitHubApiError('File not found on repository', 404, null);
    }
    if (response.status === 409) {
      throw new GitHubApiError('Conflict - file may have been modified', 409, null);
    }
    if (!response.ok) {
      throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status, null);
    }
    return response.json();
  }

  /**
   * Decode base64 content with proper UTF-8 handling for Chinese characters
   */
  decodeContent(encodedContent) {
    try {
      return decodeURIComponent(escape(atob(encodedContent)));
    } catch (e) {
      console.error('Failed to decode content:', e);
      return atob(encodedContent);
    }
  }

  /**
   * Encode content to base64 with proper UTF-8 handling for Chinese characters
   */
  encodeContent(content) {
    try {
      return btoa(unescape(encodeURIComponent(content)));
    } catch (e) {
      console.error('Failed to encode content:', e);
      return btoa(content);
    }
  }

  /**
   * Fetch a JSON file from GitHub
   */
  async fetchFile(filePath) {
    if (!this.token) {
      throw new GitHubApiError('GitHub token not configured', 401, null);
    }

    this.setStatus('syncing');

    try {
      const response = await fetch(this.buildFileUrl(filePath), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      const content = this.decodeContent(data.content);
      const parsed = JSON.parse(content);

      this.lastSyncTime = new Date().toISOString();
      this.setStatus('success');

      return {
        data: parsed,
        sha: data.sha,
        path: filePath,
        lastModified: data.commit?.commit?.author?.date || data.commit?.committer?.date,
      };
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Save a JSON file to GitHub
   */
  async saveFile(filePath, data) {
    if (!this.token) {
      throw new GitHubApiError('GitHub token not configured', 401, null);
    }

    this.setStatus('syncing');

    try {
      // First get current file SHA
      let sha = null;
      try {
        const getResponse = await fetch(this.buildFileUrl(filePath), {
          headers: this.getHeaders(),
        });
        if (getResponse.ok) {
          const fileData = await getResponse.json();
          sha = fileData.sha;
        }
      } catch (e) {
        // File doesn't exist, that's OK
      }

      // Prepare content
      const content = this.encodeContent(JSON.stringify(data, null, 2));

      // Build request body
      const body = {
        message: `Update ${filePath} via V21 Sync`,
        content,
        branch: this.config.branch,
      };
      if (sha) {
        body.sha = sha;
      }

      // Save file
      const response = await fetch(this.buildFileUrl(filePath), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const result = await this.handleResponse(response);

      this.lastSyncTime = new Date().toISOString();
      this.setStatus('success');

      return {
        commit: result.commit,
        path: filePath,
        sha: result.content?.sha,
      };
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  /**
   * Fetch proposals.json
   */
  async fetchProposals() {
    const { dataPath } = this.config;
    return this.fetchFile(`${dataPath}/proposals.json`);
  }

  /**
   * Save proposals.json
   */
  async saveProposals(data) {
    const { dataPath } = this.config;
    return this.saveFile(`${dataPath}/proposals.json`, data);
  }

  /**
   * Fetch milestones.json
   */
  async fetchMilestones() {
    const { dataPath } = this.config;
    return this.fetchFile(`${dataPath}/milestones.json`);
  }

  /**
   * Save milestones.json
   */
  async saveMilestones(data) {
    const { dataPath } = this.config;
    return this.saveFile(`${dataPath}/milestones.json`, data);
  }

  /**
   * Fetch todos.json
   */
  async fetchTodos() {
    const { dataPath } = this.config;
    return this.fetchFile(`${dataPath}/todos.json`);
  }

  /**
   * Save todos.json
   */
  async saveTodos(data) {
    const { dataPath } = this.config;
    return this.saveFile(`${dataPath}/todos.json`, data);
  }

  /**
   * Fetch all data files at once
   */
  async fetchAllData() {
    const results = {};
    const errors = [];

    // Fetch all files in parallel
    const fetchPromises = [
      this.fetchFile(`${this.config.dataPath}/proposals.json`)
        .then(r => { results.proposals = r; })
        .catch(e => { errors.push({ file: 'proposals', error: e.message }); }),
      this.fetchFile(`${this.config.dataPath}/milestones.json`)
        .then(r => { results.milestones = r; })
        .catch(e => { errors.push({ file: 'milestones', error: e.message }); }),
      this.fetchFile(`${this.config.dataPath}/todos.json`)
        .then(r => { results.todos = r; })
        .catch(e => { errors.push({ file: 'todos', error: e.message }); }),
    ];

    await Promise.allSettled(fetchPromises);

    return { results, errors };
  }

  /**
   * Validate token by making a test API call
   */
  async validateToken() {
    if (!this.token) {
      return { valid: false, error: 'No token configured' };
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const user = await response.json();
        return { valid: true, user };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid token' };
      } else {
        return { valid: false, error: `HTTP ${response.status}` };
      }
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  /**
   * Get repository info
   */
  async getRepoInfo() {
    if (!this.token) {
      throw new GitHubApiError('GitHub token not configured', 401, null);
    }

    const { owner, repo } = this.config;
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Get sync status info
   */
  getSyncInfo() {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      hasToken: this.hasToken(),
      config: this.config,
    };
  }
}

// Export singleton instance
export const githubApi = new GitHubApiService();

// Export for use in hooks
export { GitHubApiError, RateLimitError };

// Export class for testing or multiple instances
export default GitHubApiService;
