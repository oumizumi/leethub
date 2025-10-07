/**
 * github.js - GitHub REST API helpers for LeetHub
 * Implements Contents API for creating/updating files
 */

/**
 * Creates authorization headers for GitHub API requests
 * @param {string} token - GitHub Personal Access Token
 * @returns {Object} - Headers object
 */
function withAuthHeaders(token) {
  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}

/**
 * Fetches the SHA of an existing file from GitHub
 * Required for updating files via Contents API
 * @param {Object} params
 * @param {string} params.token - GitHub PAT
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {string} params.path - File path in repo
 * @param {string} params.branch - Branch name (default: main)
 * @returns {Promise<string|null>} - File SHA if exists, null otherwise
 */
async function getFileSha({ token, owner, repo, path, branch = 'main' }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: withAuthHeaders(token)
    });
    
    if (response.status === 404) {
      // File doesn't exist yet
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    return data.sha;
    
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Creates or updates a file in a GitHub repository
 * @param {Object} params
 * @param {string} params.token - GitHub PAT
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {string} params.path - File path in repo
 * @param {string} params.contentBase64 - Base64 encoded file content
 * @param {string} params.message - Commit message
 * @param {string} params.sha - File SHA (required for updates, omit for creation)
 * @param {string} params.branch - Branch name (default: main)
 * @returns {Promise<Object>} - GitHub API response
 */
async function putFile({ token, owner, repo, path, contentBase64, message, sha = null, branch = 'main' }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  const body = {
    message,
    content: contentBase64,
    branch
  };
  
  // Include SHA if updating existing file
  if (sha) {
    body.sha = sha;
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: withAuthHeaders(token),
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

/**
 * Tests GitHub authentication and repository access
 * @param {Object} params
 * @param {string} params.token - GitHub PAT
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} - Repository info if successful
 */
async function testGitHubAccess({ token, owner, repo }) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: withAuthHeaders(token)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cannot access repository: ${response.status} - ${error}`);
  }
  
  return await response.json();
}

/**
 * Checks if two Base64-encoded contents are identical
 * Used for idempotency - skip commit if content unchanged
 * @param {string} existingBase64 - Existing file content (base64)
 * @param {string} newBase64 - New file content (base64)
 * @returns {boolean} - True if contents are identical
 */
function contentsAreEqual(existingBase64, newBase64) {
  // Remove any whitespace/newlines that might differ
  const normalize = (str) => str.replace(/\s/g, '');
  return normalize(existingBase64) === normalize(newBase64);
}

/**
 * Builds a commit message with metadata
 * @param {Object} params
 * @param {string} params.title - Problem title
 * @param {string} params.language - Programming language
 * @param {string} params.problemUrl - URL to the problem
 * @param {string} params.runtime - Runtime if available
 * @param {string} params.memory - Memory usage if available
 * @param {string} params.acceptedAt - ISO timestamp
 * @returns {string} - Formatted commit message
 */
function buildCommitMessage({ title, language, problemUrl, runtime, memory, acceptedAt }) {
  let message = `feat: ${title} (${language}) — Accepted`;
  
  const details = [];
  if (problemUrl) details.push(`Problem: ${problemUrl}`);
  if (runtime) details.push(`Runtime: ${runtime}`);
  if (memory) details.push(`Memory: ${memory}`);
  if (acceptedAt) details.push(`Accepted at: ${acceptedAt}`);
  
  if (details.length > 0) {
    message += '\n\n' + details.join('\n');
  }
  
  return message;
}

// Export for ES6 modules (when needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    withAuthHeaders,
    getFileSha,
    putFile,
    testGitHubAccess,
    contentsAreEqual,
    buildCommitMessage
  };
}

