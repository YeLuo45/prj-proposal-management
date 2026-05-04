/**
 * GitHubIssuePanel - V25
 * Panel for managing GitHub Issues with PR association support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { githubIssues, GitHubIssuesError } from '../services/githubIssues';

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const LABEL_COLORS = {
  bug: 'bg-red-500 text-white',
  enhancement: 'bg-blue-500 text-white',
  question: 'bg-purple-500 text-white',
  documentation: 'bg-yellow-500 text-black',
  help: 'bg-orange-500 text-white',
  'priority-high': 'bg-red-600 text-white',
  'priority-medium': 'bg-yellow-600 text-white',
  'priority-low': 'bg-green-600 text-white',
};

export function GitHubIssuePanel({ 
  proposal, 
  onClose, 
  onIssueCreated, 
  onIssueLinked,
  onStatusChange 
}) {
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('issues'); // issues | prs | linked
  const [issues, setIssues] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPRSelector, setShowPRSelector] = useState(false);
  
  // Create issue form state
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');
  const [newIssueLabels, setNewIssueLabels] = useState([]);
  
  // Filter state
  const [issueFilter, setIssueFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load issues on mount
  useEffect(() => {
    loadIssues();
    loadPullRequests();
  }, []);

  // Filter issues based on status and search
  const filteredIssues = useMemo(() => {
    let result = issues;
    
    if (issueFilter !== 'all') {
      result = result.filter(issue => issue.state === issueFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue => 
        issue.title.toLowerCase().includes(query) ||
        issue.body?.toLowerCase().includes(query) ||
        issue.number.toString().includes(query)
      );
    }
    
    return result;
  }, [issues, issueFilter, searchQuery]);

  // Get linked PRs for selected issue
  const linkedPRs = useMemo(() => {
    if (!selectedIssue?.body) return [];
    return githubIssues.extractLinkedPRs(selectedIssue.body);
  }, [selectedIssue]);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await githubIssues.listIssues({ state: 'all', per_page: 100 });
      setIssues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPullRequests = useCallback(async () => {
    try {
      const data = await githubIssues.listPullRequests({ state: 'all', per_page: 100 });
      setPullRequests(data);
    } catch (err) {
      console.error('Failed to load PRs:', err);
    }
  }, []);

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const issue = await githubIssues.createIssue({
        title: newIssueTitle,
        body: newIssueBody,
        labels: newIssueLabels,
      });
      
      // Add proposal reference to issue body if proposal exists
      if (proposal) {
        const proposalRef = `\n\n---\n**Proposal ID**: ${proposal.id}\n**Project**: ${proposal.name || proposal.id}`;
        await githubIssues.updateIssue(issue.number, { 
          body: (issue.body || '') + proposalRef 
        });
      }
      
      setIssues(prev => [issue, ...prev]);
      setShowCreateForm(false);
      setNewIssueTitle('');
      setNewIssueBody('');
      setNewIssueLabels([]);
      
      if (onIssueCreated) {
        onIssueCreated(issue);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async (issueNumber, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const updated = await githubIssues.updateIssue(issueNumber, updates);
      setIssues(prev => prev.map(i => i.number === issueNumber ? updated : i));
      if (selectedIssue?.number === issueNumber) {
        setSelectedIssue(updated);
      }
      
      if (onStatusChange && updates.state) {
        onStatusChange(issueNumber, updates.state);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseIssue = async (issueNumber) => {
    await handleUpdateIssue(issueNumber, { state: 'closed' });
  };

  const handleReopenIssue = async (issueNumber) => {
    await handleUpdateIssue(issueNumber, { state: 'open' });
  };

  const handleLinkPR = async (issueNumber, pr) => {
    setLoading(true);
    setError(null);
    
    try {
      await githubIssues.linkProposalToPR(
        issueNumber,
        pr.number,
        pr.html_url,
        proposal?.id || 'unknown'
      );
      
      // Reload the issue to get updated body
      const updated = await githubIssues.getIssue(issueNumber);
      setIssues(prev => prev.map(i => i.number === issueNumber ? updated : i));
      setSelectedIssue(updated);
      
      if (onIssueLinked) {
        onIssueLinked(issueNumber, pr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = async (issueNumber, label) => {
    setLoading(true);
    setError(null);
    
    try {
      await githubIssues.addLabels(issueNumber, [label]);
      const updated = await githubIssues.getIssue(issueNumber);
      setIssues(prev => prev.map(i => i.number === issueNumber ? updated : i));
      if (selectedIssue?.number === issueNumber) {
        setSelectedIssue(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLabelStyle = (labelName) => {
    const color = labelName.includes('priority-high') || labelName.includes('high') ? 'bg-red-500' :
                  labelName.includes('priority-medium') || labelName.includes('medium') ? 'bg-yellow-500' :
                  labelName.includes('priority-low') || labelName.includes('low') ? 'bg-green-500' :
                  'bg-gray-500';
    return `${color} text-white text-xs px-2 py-0.5 rounded-full`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              GitHub Issues & PRs
            </h2>
            {proposal && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Linked to: {proposal.name || proposal.id}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'issues'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Issues ({issues.filter(i => i.state === 'open').length} open)
          </button>
          <button
            onClick={() => setActiveTab('prs')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'prs'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pull Requests ({pullRequests.filter(pr => pr.state === 'open').length} open)
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'linked'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Linked
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left panel - list */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Actions bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              {activeTab === 'issues' && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                    >
                      + New Issue
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={issueFilter}
                      onChange={(e) => setIssueFilter(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={loadIssues}
                      disabled={loading}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </>
              )}
              {activeTab === 'prs' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search PRs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={loadPullRequests}
                    disabled={loading}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'issues' && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredIssues.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No issues found
                    </div>
                  ) : (
                    filteredIssues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedIssue?.id === issue.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full ${
                            issue.state === 'open' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                #{issue.number}
                              </span>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${
                                STATUS_COLORS[issue.state]
                              }`}>
                                {issue.state}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                              {issue.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {issue.labels?.slice(0, 3).map(label => (
                                <span key={label.id} className={getLabelStyle(label.name)}>
                                  {label.name}
                                </span>
                              ))}
                              {issue.labels?.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{issue.labels.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prs' && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pullRequests.filter(pr => 
                    !searchQuery || 
                    pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pr.number.toString().includes(searchQuery)
                  ).length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No pull requests found
                    </div>
                  ) : (
                    pullRequests
                      .filter(pr => 
                        !searchQuery || 
                        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pr.number.toString().includes(searchQuery)
                      )
                      .map(pr => (
                        <div
                          key={pr.id}
                          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full ${
                              pr.state === 'open' ? 'bg-green-500' : pr.merged ? 'bg-purple-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  #{pr.number}
                                </span>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                  pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  pr.merged ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {pr.merged ? 'merged' : pr.state}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                                {pr.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                by {pr.user?.login} • {formatDate(pr.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeTab === 'linked' && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {selectedIssue ? (
                    linkedPRs.length > 0 ? (
                      <div className="space-y-4 text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Linked Pull Requests
                        </h4>
                        {linkedPRs.map(pr => (
                          <a
                            key={pr.number}
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/>
                              </svg>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                #{pr.number}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                              {pr.url}
                            </p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p>No linked PRs for this issue</p>
                    )
                  ) : (
                    <p>Select an issue to see linked PRs</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - detail */}
          <div className="w-1/2 flex flex-col">
            {selectedIssue ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-sm rounded ${
                      STATUS_COLORS[selectedIssue.state]
                    }`}>
                      {selectedIssue.state}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      #{selectedIssue.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedIssue.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Opened by {selectedIssue.user?.login} • {formatDate(selectedIssue.created_at)}
                  </p>
                </div>

                {/* Labels */}
                {selectedIssue.labels?.length > 0 && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedIssue.labels.map(label => (
                        <span key={label.id} className={getLabelStyle(label.name)}>
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedIssue.body ? (
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      {selectedIssue.body.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('---') ? 'border-t border-gray-300 dark:border-gray-600 my-4 pt-4' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No description provided</p>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  {selectedIssue.state === 'open' ? (
                    <button
                      onClick={() => handleCloseIssue(selectedIssue.number)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Close Issue
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopenIssue(selectedIssue.number)}
                      disabled={loading}
                      className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Reopen Issue
                    </button>
                  )}
                  <button
                    onClick={() => setShowPRSelector(true)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Link PR
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select an issue to view details
              </div>
            )}
          </div>
        </div>

        {/* Create Issue Modal */}
        {showCreateForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Issue
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newIssueTitle}
                    onChange={(e) => setNewIssueTitle(e.target.value)}
                    placeholder="Issue title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newIssueBody}
                    onChange={(e) => setNewIssueBody(e.target.value)}
                    placeholder="Issue description (supports Markdown)"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Labels (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newIssueLabels.join(', ')}
                    onChange={(e) => setNewIssueLabels(e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
                    placeholder="bug, enhancement, priority-high"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewIssueTitle('');
                    setNewIssueBody('');
                    setNewIssueLabels([]);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIssue}
                  disabled={loading || !newIssueTitle.trim()}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PR Selector Modal */}
        {showPRSelector && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Link Pull Request
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select a PR to link to issue #{selectedIssue?.number}
              </p>
              <div className="space-y-2">
                {pullRequests.filter(pr => pr.state === 'open').length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No open pull requests found
                  </p>
                ) : (
                  pullRequests
                    .filter(pr => pr.state === 'open')
                    .map(pr => (
                      <div
                        key={pr.id}
                        onClick={() => {
                          handleLinkPR(selectedIssue.number, pr);
                          setShowPRSelector(false);
                        }}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/>
                          </svg>
                          <span className="font-medium text-gray-900 dark:text-white">
                            #{pr.number}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                          {pr.title}
                        </p>
                      </div>
                    ))
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowPRSelector(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GitHubIssuePanel;
