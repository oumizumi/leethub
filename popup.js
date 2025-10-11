/**
 * popup.js - Extension popup logic
 * Displays status, activity log, and manual push button
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('LeetHub popup loaded');
  
  // Load and display current settings
  await loadStatus();
  
  // Load and display statistics
  await loadStatistics();
  
  // Load and display activity log
  await loadActivityLog();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Loads and displays connection status
 */
async function loadStatus() {
  try {
    const settings = await chrome.storage.local.get([
      'githubOwner',
      'githubRepo',
      'githubBranch'
    ]);
    
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const repoSpan = document.getElementById('repo');
    
    if (settings.githubOwner && settings.githubRepo) {
      // Configured
      statusDot.className = 'status-dot status-connected';
      statusText.textContent = 'Connected';
      repoSpan.textContent = `${settings.githubOwner}/${settings.githubRepo}`;
      
      const branch = settings.githubBranch || 'main';
      const branchSpan = document.getElementById('branch');
      branchSpan.textContent = branch;
    } else {
      // Not configured
      statusDot.className = 'status-dot status-disconnected';
      statusText.textContent = 'Not configured';
      repoSpan.textContent = 'Configure in Options';
      document.getElementById('branch').textContent = '-';
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

/**
 * Loads and displays statistics
 */
async function loadStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_STATISTICS'
    });
    
    if (response && response.success && response.statistics) {
      const stats = response.statistics;
      document.getElementById('totalSolved').textContent = stats.totalSolved || 0;
      document.getElementById('easyCount').textContent = stats.byDifficulty?.Easy || 0;
      document.getElementById('mediumCount').textContent = stats.byDifficulty?.Medium || 0;
      document.getElementById('hardCount').textContent = stats.byDifficulty?.Hard || 0;
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

/**
 * Loads and displays activity log
 */
async function loadActivityLog() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_ACTIVITY_LOG'
    });
    
    if (response && response.success) {
      displayActivityLog(response.log);
    } else {
      displayActivityLog([]);
    }
  } catch (error) {
    console.error('Error loading activity log:', error);
    displayActivityLog([]);
  }
}

/**
 * Displays activity log in the UI
 */
function displayActivityLog(log) {
  const logContainer = document.getElementById('activityLog');
  
  if (!log || log.length === 0) {
    logContainer.innerHTML = '<div class="log-empty">No recent activity</div>';
    return;
  }
  
  logContainer.innerHTML = '';
  
  log.forEach(entry => {
    const logItem = createLogItem(entry);
    logContainer.appendChild(logItem);
  });
}

/**
 * Creates a log item element
 */
function createLogItem(entry) {
  const item = document.createElement('div');
  item.className = `log-item log-${entry.status}`;
  
  const icon = getStatusIcon(entry.status);
  const timeStr = formatTimeAgo(entry.timestamp);
  
  item.innerHTML = `
    <div class="log-icon">${icon}</div>
    <div class="log-content">
      <div class="log-message">${escapeHtml(entry.message)}</div>
      <div class="log-meta">
        ${entry.difficulty ? `<span class="badge badge-${entry.difficulty.toLowerCase()}">${entry.difficulty}</span>` : ''}
        ${entry.language ? `<span class="badge">${entry.language}</span>` : ''}
        <span class="log-time">${timeStr}</span>
      </div>
    </div>
  `;
  
  return item;
}

/**
 * Gets icon for status
 */
function getStatusIcon(status) {
  const icons = {
    'success': '✓',
    'error': '✗',
    'skipped': '⊘',
    'pending': '○'
  };
  return icons[status] || '•';
}

/**
 * Formats timestamp as relative time
 */
function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return time.toLocaleDateString();
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
  // Manual push button
  const pushButton = document.getElementById('pushButton');
  pushButton.addEventListener('click', handleManualPush);
  
  // Refresh log button
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      await loadStatistics();
      await loadActivityLog();
    });
  }
  
  // Options link
  const optionsLink = document.getElementById('optionsLink');
  if (optionsLink) {
    optionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Handles manual push button click
 */
async function handleManualPush() {
  const pushButton = document.getElementById('pushButton');
  const statusMessage = document.getElementById('statusMessage');
  
  try {
    // Disable button
    pushButton.disabled = true;
    pushButton.textContent = 'Pushing...';
    
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Check if on LeetCode
    if (!tab.url || !tab.url.includes('leetcode.com/problems/')) {
      throw new Error('Please open a LeetCode problem page');
    }
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'MANUAL_PUSH'
    });
    
    if (response && response.success) {
      showStatus('Successfully pushed to GitHub!', 'success');
      // Reload statistics and log after a short delay
      setTimeout(async () => {
        await loadStatistics();
        await loadActivityLog();
      }, 1000);
    } else {
      throw new Error(response?.error || 'Failed to push');
    }
    
  } catch (error) {
    console.error('Manual push error:', error);
    showStatus(error.message, 'error');
  } finally {
    // Re-enable button
    pushButton.disabled = false;
    pushButton.textContent = 'Push Current Page';
  }
}

/**
 * Shows a status message
 */
function showStatus(message, type = 'info') {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-message-${type}`;
  statusMessage.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 5000);
}
