/**
 * options.js - Configuration page logic for LeetHub
 * Handles saving/loading settings and testing GitHub connection
 */

// DOM elements
const form = document.getElementById('optionsForm');
const testButton = document.getElementById('testButton');
const messageDiv = document.getElementById('message');

// Form inputs
const tokenInput = document.getElementById('token');
const ownerInput = document.getElementById('owner');
const repoInput = document.getElementById('repo');
const branchInput = document.getElementById('branch');
const rootFolderInput = document.getElementById('rootFolder');
const commitTemplateInput = document.getElementById('commitTemplate');
const autoPushInput = document.getElementById('autoPush');
const notificationsInput = document.getElementById('notifications');
const debugModeInput = document.getElementById('debugMode');

/**
 * Shows a message to the user
 * @param {string} text - Message text
 * @param {string} type - 'success' or 'error'
 */
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message show ${type}`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

/**
 * Loads saved settings from chrome.storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'githubToken',
      'githubOwner',
      'githubRepo',
      'githubBranch',
      'rootFolder',
      'commitMessageTemplate',
      'autoPushEnabled',
      'notificationsEnabled',
      'debugMode'
    ]);
    
    if (settings.githubToken) tokenInput.value = settings.githubToken;
    if (settings.githubOwner) ownerInput.value = settings.githubOwner;
    if (settings.githubRepo) repoInput.value = settings.githubRepo;
    if (settings.githubBranch) branchInput.value = settings.githubBranch;
    if (settings.rootFolder) rootFolderInput.value = settings.rootFolder;
    if (settings.commitMessageTemplate) commitTemplateInput.value = settings.commitMessageTemplate;
    
    // Set checkboxes (default to true if not set)
    autoPushInput.checked = settings.autoPushEnabled !== false;
    notificationsInput.checked = settings.notificationsEnabled !== false;
    debugModeInput.checked = settings.debugMode || false;
    
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage('Failed to load settings', 'error');
  }
}

/**
 * Saves settings to chrome.storage
 * @param {Event} e - Form submit event
 */
async function saveSettings(e) {
  e.preventDefault();
  
  // Get form values
  const settings = {
    githubToken: tokenInput.value.trim(),
    githubOwner: ownerInput.value.trim(),
    githubRepo: repoInput.value.trim(),
    githubBranch: branchInput.value.trim() || 'main',
    rootFolder: rootFolderInput.value.trim() || 'leethub/',
    commitMessageTemplate: commitTemplateInput.value.trim(),
    autoPushEnabled: autoPushInput.checked,
    notificationsEnabled: notificationsInput.checked,
    debugMode: debugModeInput.checked
  };
  
  // Validate required fields
  if (!settings.githubToken || !settings.githubOwner || !settings.githubRepo) {
    showMessage('Please fill in all required fields', 'error');
    return;
  }
  
  // Ensure root folder ends with /
  if (!settings.rootFolder.endsWith('/')) {
    settings.rootFolder += '/';
  }
  
  try {
    // Save to storage
    await chrome.storage.local.set(settings);
    showMessage('Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showMessage('Failed to save settings', 'error');
  }
}

/**
 * Tests GitHub connection with current settings
 */
async function testGitHubConnection() {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  
  if (!token || !owner || !repo) {
    showMessage('Please fill in token, owner, and repo first', 'error');
    return;
  }
  
  // Disable button and show loading state
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  
  try {
    // Test GitHub API access (from github.js)
    const repoInfo = await testGitHubAccess({ token, owner, repo });
    
    // Show success with repo details
    const message = `Connected to ${repoInfo.full_name}! ${repoInfo.private ? '(Private)' : '(Public)'}`;
    showMessage(message, 'success');
    
  } catch (error) {
    console.error('GitHub test failed:', error);
    
    // Parse error message
    let errorMsg = 'Connection failed: ';
    if (error.message.includes('401')) {
      errorMsg += 'Invalid token or insufficient permissions';
    } else if (error.message.includes('404')) {
      errorMsg += 'Repository not found. Check owner and repo name.';
    } else if (error.message.includes('403')) {
      errorMsg += 'Access forbidden. Check token scopes.';
    } else {
      errorMsg += error.message;
    }
    
    showMessage(errorMsg, 'error');
    
  } finally {
    // Re-enable button
    testButton.disabled = false;
    testButton.textContent = 'Test GitHub';
  }
}

// Event listeners
form.addEventListener('submit', saveSettings);
testButton.addEventListener('click', testGitHubConnection);

// Load settings when page opens
document.addEventListener('DOMContentLoaded', loadSettings);

