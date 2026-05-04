/**
 * GitHub Issues Service - V25
 * Manages GitHub Issues with full CRUD, PR association, and sync support
 */

const GITHUB_API_BASE = 'https://api.github.com';

// Default configuration
const DEFAULT_CONFIG = {
  owner: 'YeLuo45',
  repo: 'prj-proposals-manager',
  branch: 'master',
};

class GitHubIssuesError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'GitHubIssuesError';
    this.status = status;
    this.response = response;
  }
}

class RateLimitError extends GitHubIssuesError {
  constructor(resetTime) {
    super('GitHub API rate limit exceeded', 403, null);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

class GitHubIssuesService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.token = null;
    this.listeners = new Set();
  }

  /**
   * Configure the service
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
      localStorage.setItem('github_issues_token', token);
    } else {
      localStorage.removeItem('github_issues_token');
    }
    this.notifyListeners();
  }

  /**
   * Load stored token
   */
  loadToken() {
    this.token = localStorage.getItem('github_issues_token') || localStorage.getItem('github_token');
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
   * Build API URL
   */
  buildUrl(path) {
    const { owner, repo } = this.config;
    return `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  }

  /**
   * Check if token is configured
   */
  hasToken() {
    return !!this.token;
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (response.status === 401) {
      throw new GitHubIssuesError('Invalid or expired GitHub token', 401, null);
    }
    if (response.status === 403) {
      const resetHeader = response.headers.get('X-RateLimit-Reset');
      if (resetHeader) {
        const resetTime = new Date(parseInt(resetHeader) * 1000);
        throw new RateLimitError(resetTime);
      }
      throw new GitHubIssuesError('Access forbidden', 403, null);
    }
    if (response.status === 404) {
      throw new GitHubIssuesError('Resource not found', 404, null);
    }
    if (!response.ok) {
      throw new GitHubIssuesError(`GitHub API error: ${response.statusText}`, response.status, null);
    }
    // Handle 204 No Content for some operations
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  /**
   * List all issues with optional filters
   */
  async listIssues(options = {}) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    const {
      state = 'all', // open, closed, all
      labels,
      sort = 'updated',
      direction = 'desc',
      per_page = 100,
      page = 1,
    } = options;

    let url = `issues?state=${state}&sort=${sort}&direction=${direction}&per_page=${per_page}&page=${page}`;
    if (labels) {
      url += `&labels=${encodeURIComponent(labels)}`;
    }

    try {
      const response = await fetch(this.buildUrl(url), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to list issues:', error);
      throw error;
    }
  }

  /**
   * Get a single issue by number
   */
  async getIssue(issueNumber) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}`), {
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Failed to get issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  async createIssue({ title, body, labels = [], assignees = [], milestone }) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl('issues'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title,
          body,
          labels,
          assignees,
          milestone,
        }),
      });

      const issue = await this.handleResponse(response);
      this.notifyListeners();
      return issue;
    } catch (error) {
      console.error('Failed to create issue:', error);
      throw error;
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueNumber, updates) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    const { title, body, state, labels, assignees, milestone } = updates;

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title,
          body,
          state,
          labels,
          assignees,
          milestone,
        }),
      });

      const issue = await this.handleResponse(response);
      this.notifyListeners();
      return issue;
    } catch (error) {
      console.error(`Failed to update issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Close an issue
   */
  async closeIssue(issueNumber) {
    return this.updateIssue(issueNumber, { state: 'closed' });
  }

  /**
   * Reopen an issue
   */
  async reopenIssue(issueNumber) {
    return this.updateIssue(issueNumber, { state: 'open' });
  }

  /**
   * Add labels to an issue
   */
  async addLabels(issueNumber, labels) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}/labels`), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ labels }),
      });

      const result = await this.handleResponse(response);
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error(`Failed to add labels to issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Remove a label from an issue
   */
  async removeLabel(issueNumber, label) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}/labels/${encodeURIComponent(label)}`), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      await this.handleResponse(response);
      this.notifyListeners();
    } catch (error) {
      console.error(`Failed to remove label from issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * List all pull requests
   */
  async listPullRequests(options = {}) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    const {
      state = 'all',
      sort = 'updated',
      direction = 'desc',
      per_page = 100,
      page = 1,
    } = options;

    const url = `pulls?state=${state}&sort=${sort}&direction=${direction}&per_page=${per_page}&page=${page}`;

    try {
      const response = await fetch(this.buildUrl(url), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to list pull requests:', error);
      throw error;
    }
  }

  /**
   * Get a single pull request
   */
  async getPullRequest(prNumber) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`pulls/${prNumber}`), {
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Failed to get PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * List issues associated with a pull request
   */
  async getPRIssues(prNumber) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`pulls/${prNumber}/issues`), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to get issues for PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Search issues and PRs
   */
  async searchIssues(query, options = {}) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    const { sort, order = 'desc', per_page = 100 } = options;
    let url = `search/issues?q=${encodeURIComponent(query)}&per_page=${per_page}`;
    if (sort) url += `&sort=${sort}&order=${order}`;

    try {
      const response = await fetch(`${GITHUB_API_BASE}/${url}`, {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return {
        items: data.items || [],
        total_count: data.total_count || 0,
      };
    } catch (error) {
      console.error('Failed to search issues:', error);
      throw error;
    }
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueNumber) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}/comments`), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to get comments for issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Create an issue comment
   */
  async createIssueComment(issueNumber, body) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}/comments`), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ body }),
      });

      const comment = await this.handleResponse(response);
      this.notifyListeners();
      return comment;
    } catch (error) {
      console.error(`Failed to create comment on issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get repository labels
   */
  async getLabels() {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl('labels'), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to get labels:', error);
      throw error;
    }
  }

  /**
   * Create a label
   */
  async createLabel({ name, color, description }) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl('labels'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, color, description }),
      });

      const label = await this.handleResponse(response);
      this.notifyListeners();
      return label;
    } catch (error) {
      console.error('Failed to create label:', error);
      throw error;
    }
  }

  /**
   * Get milestones
   */
  async getMilestones() {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl('milestones?state=all'), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to get milestones:', error);
      throw error;
    }
  }

  /**
   * Create a milestone
   */
  async createMilestone({ title, description, state = 'open', due_on }) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl('milestones'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title, description, state, due_on }),
      });

      const milestone = await this.handleResponse(response);
      this.notifyListeners();
      return milestone;
    } catch (error) {
      console.error('Failed to create milestone:', error);
      throw error;
    }
  }

  /**
   * Link proposal to PR by adding PR reference in issue body
   */
  async linkProposalToPR(issueNumber, prNumber, prUrl, proposalId) {
    try {
      const issue = await this.getIssue(issueNumber);
      const currentBody = issue.body || '';
      
      // Parse existing linked PRs
      const linkedPRs = this.extractLinkedPRs(currentBody);
      
      // Add new PR if not already linked
      if (!linkedPRs.find(pr => pr.number === prNumber)) {
        const prLink = `\n\n---\n**Linked PR #${prNumber}**: ${prUrl}\n**Proposal ID**: ${proposalId}`;
        const newBody = currentBody + prLink;
        
        return this.updateIssue(issueNumber, { body: newBody });
      }
      
      return issue;
    } catch (error) {
      console.error(`Failed to link issue #${issueNumber} to PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Extract linked PRs from issue body
   */
  extractLinkedPRs(body) {
    if (!body) return [];
    
    const prRegex = /\*\*Linked PR #(\d+)\*\*: (https:\/\/github\.com\/[^\s]+)/g;
    const proposalsRegex = /\*\*Proposal ID\*\*: ([^\n]+)/g;
    
    const linkedPRs = [];
    let match;
    
    while ((match = prRegex.exec(body)) !== null) {
      linkedPRs.push({
        number: parseInt(match[1], 10),
        url: match[2],
      });
    }
    
    return linkedPRs;
  }

  /**
   * Get issue timeline (events)
   */
  async getIssueTimeline(issueNumber) {
    if (!this.token) {
      throw new GitHubIssuesError('GitHub token not configured', 401, null);
    }

    try {
      const response = await fetch(this.buildUrl(`issues/${issueNumber}/timeline`), {
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to get timeline for issue #${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Validate token
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
   * Get service info
   */
  getInfo() {
    return {
      hasToken: this.hasToken(),
      config: this.config,
    };
  }
}

// Export singleton instance
export const githubIssues = new GitHubIssuesService();

// Export error classes
export { GitHubIssuesError, RateLimitError };

// Export class for testing
export default GitHubIssuesService;
