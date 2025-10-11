/**
 * background.js - Service Worker for LeetHub
 * Handles GitHub push orchestration and activity logging
 */

// Import utilities (in manifest v3, we need to use importScripts)
importScripts('utils.js', 'github.js');

console.log('LeetHub background service worker initialized');

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  MAX_LOG_ENTRIES: 10
};

/**
 * Message listener - handles submissions from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('LeetHub: Received message:', request.action);
  
  if (request.action === 'ACCEPTED_SUBMISSION') {
    handleAcceptedSubmission(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'GET_ACTIVITY_LOG') {
    getActivityLog()
      .then(log => sendResponse({ success: true, log }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'GET_STATISTICS') {
    chrome.storage.local.get('statistics')
      .then(({ statistics = {} }) => sendResponse({ success: true, statistics }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'CHECK_AUTO_PUSH') {
    chrome.storage.local.get('autoPushEnabled')
      .then(({ autoPushEnabled = true }) => sendResponse({ enabled: autoPushEnabled }))
      .catch(() => sendResponse({ enabled: true }));
    return true;
  }
  
  return false;
});

/**
 * Handles an accepted submission - main orchestration logic
 */
async function handleAcceptedSubmission(data) {
  console.log('LeetHub: Processing accepted submission:', data.problemTitle);
  
  try {
    // 1. Load settings
    const settings = await loadSettings();
    if (!settings) {
      throw new Error('LeetHub not configured. Please set up GitHub settings in Options.');
    }
    
    // 2. Validate settings
    validateSettings(settings);
    
    // 3. Build file path
    const filePath = buildFilePath(data, settings);
    console.log('LeetHub: Target file path:', filePath);
    
    // 4. Encode content
    const contentBase64 = safeBase64Encode(data.code);
    
    // 5. Check if file exists and get SHA
    let existingSha = null;
    try {
      existingSha = await getFileSha({
        token: settings.githubToken,
        owner: settings.githubOwner,
        repo: settings.githubRepo,
        path: filePath,
        branch: settings.githubBranch
      });
      console.log('LeetHub: Existing file SHA:', existingSha || 'None (new file)');
    } catch (error) {
      console.warn('LeetHub: Could not fetch existing SHA:', error.message);
      // File probably doesn't exist, which is fine
    }
    
    // 6. Check idempotency - skip if content unchanged
    if (existingSha) {
      const isEqual = await checkContentEquality(
        settings,
        filePath,
        contentBase64
      );
      
      if (isEqual) {
        console.log('LeetHub: Content unchanged, skipping push');
        await logActivity({
          status: 'skipped',
          message: `${data.problemTitle} - Content unchanged`,
          problemTitle: data.problemTitle,
          difficulty: data.difficulty
        });
        return { success: true, skipped: true, message: 'Content unchanged' };
      }
    }
    
    // 7. Build commit message
    const commitMessage = buildCommitMessage({
      title: data.problemTitle,
      language: data.language,
      problemUrl: data.problemUrl,
      runtime: data.runtime,
      memory: data.memory,
      acceptedAt: data.acceptedAt
    });
    
    // 8. Push to GitHub with retry logic
    const result = await retryOperation(
      () => putFile({
        token: settings.githubToken,
        owner: settings.githubOwner,
        repo: settings.githubRepo,
        path: filePath,
        contentBase64,
        message: commitMessage,
        sha: existingSha,
        branch: settings.githubBranch
      }),
      CONFIG.MAX_RETRIES,
      CONFIG.RETRY_DELAY
    );
    
    // 9. Log success
    await logActivity({
      status: 'success',
      message: `Pushed: ${data.problemTitle}`,
      problemTitle: data.problemTitle,
      difficulty: data.difficulty,
      language: data.language,
      url: result.content?.html_url || data.problemUrl
    });
    
    console.log('LeetHub: Successfully pushed to GitHub!');
    
    // 10. Show notification (if enabled)
    await showNotification({
      title: '✓ LeetHub Success',
      message: `${data.problemTitle} pushed to GitHub!`,
      url: result.content?.html_url
    });
    
    // 11. Update statistics
    await updateStatistics(data);
    
    return {
      success: true,
      message: 'Successfully pushed to GitHub',
      url: result.content?.html_url
    };
    
  } catch (error) {
    console.error('LeetHub: Error processing submission:', error);
    
    // Parse error for better messaging
    let errorMsg = error.message;
    if (error.message.includes('409')) {
      errorMsg = 'File already exists with different content (409 conflict)';
    } else if (error.message.includes('422')) {
      errorMsg = 'Invalid request - check file path and content';
    }
    
    // Log error
    await logActivity({
      status: 'error',
      message: `Failed: ${data.problemTitle} - ${errorMsg}`,
      problemTitle: data.problemTitle,
      difficulty: data.difficulty,
      error: errorMsg
    });
    
    return { success: false, error: errorMsg };
  }
}

/**
 * Loads settings from chrome.storage
 */
async function loadSettings() {
  const keys = [
    'githubToken',
    'githubOwner',
    'githubRepo',
    'githubBranch',
    'githubRootFolder',
    'autoPushEnabled',
    'notificationsEnabled',
    'commitMessageTemplate',
    'debugMode'
  ];
  
  const settings = await chrome.storage.local.get(keys);
  
  // Check if required fields exist
  if (!settings.githubToken || !settings.githubOwner || !settings.githubRepo) {
    return null;
  }
  
  // Set defaults
  settings.githubBranch = settings.githubBranch || 'main';
  settings.githubRootFolder = settings.githubRootFolder || 'leethub';
  settings.autoPushEnabled = settings.autoPushEnabled !== false; // Default true
  settings.notificationsEnabled = settings.notificationsEnabled !== false; // Default true
  settings.commitMessageTemplate = settings.commitMessageTemplate || '';
  settings.debugMode = settings.debugMode || false;
  
  return settings;
}

/**
 * Validates settings
 */
function validateSettings(settings) {
  if (!settings.githubToken) {
    throw new Error('GitHub token not configured');
  }
  if (!settings.githubOwner) {
    throw new Error('GitHub owner not configured');
  }
  if (!settings.githubRepo) {
    throw new Error('GitHub repository not configured');
  }
}

/**
 * Builds the file path in the repository
 */
function buildFilePath(data, settings) {
  const rootFolder = settings.githubRootFolder.replace(/^\/+|\/+$/g, ''); // Trim slashes
  const difficulty = data.difficulty || 'Unknown';
  const sanitizedTitle = sanitizeTitle(data.problemTitle);
  const extension = extFromLanguage(data.language);
  
  return `${rootFolder}/${difficulty}/${sanitizedTitle}${extension}`;
}

/**
 * Checks if content is equal to existing file
 */
async function checkContentEquality(settings, filePath, newContentBase64) {
  try {
    const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${filePath}?ref=${settings.githubBranch}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return contentsAreEqual(data.content, newContentBase64);
    
  } catch (error) {
    console.warn('LeetHub: Error checking content equality:', error);
    return false;
  }
}

/**
 * Retry logic for transient errors
 */
async function retryOperation(operation, maxRetries, delayMs) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`LeetHub: Attempt ${attempt} failed:`, error.message);
      
      // Check if error is retryable
      if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
        // Don't retry auth/not found errors
        throw error;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await sleep(delayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Logs activity to chrome.storage
 */
async function logActivity(entry) {
  try {
    // Load existing log
    const { activityLog = [] } = await chrome.storage.local.get('activityLog');
    
    // Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = formatTimestamp();
    }
    
    // Prepend new entry (most recent first)
    activityLog.unshift(entry);
    
    // Keep only last N entries
    const trimmedLog = activityLog.slice(0, CONFIG.MAX_LOG_ENTRIES);
    
    // Save back to storage
    await chrome.storage.local.set({ activityLog: trimmedLog });
    
    console.log('LeetHub: Activity logged:', entry);
  } catch (error) {
    console.error('LeetHub: Error logging activity:', error);
  }
}

/**
 * Gets activity log
 */
async function getActivityLog() {
  const { activityLog = [] } = await chrome.storage.local.get('activityLog');
  return activityLog;
}

/**
 * Shows a notification to the user
 */
async function showNotification({ title, message, url }) {
  try {
    const settings = await chrome.storage.local.get('notificationsEnabled');
    if (settings.notificationsEnabled === false) {
      return; // Notifications disabled
    }
    
    const notificationId = await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: title,
      message: message,
      priority: 1,
      isClickable: !!url
    });
    
    // Store URL for click handler
    if (url) {
      notificationUrls.set(notificationId, url);
    }
  } catch (error) {
    console.warn('LeetHub: Could not show notification:', error);
  }
}

// Store notification URLs for click handling
const notificationUrls = new Map();

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  const url = notificationUrls.get(notificationId);
  if (url) {
    chrome.tabs.create({ url });
    notificationUrls.delete(notificationId);
  }
});

/**
 * Updates statistics
 */
async function updateStatistics(data) {
  try {
    const { statistics = {} } = await chrome.storage.local.get('statistics');
    
    // Initialize if needed
    if (!statistics.totalSolved) statistics.totalSolved = 0;
    if (!statistics.byDifficulty) statistics.byDifficulty = { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 };
    if (!statistics.byLanguage) statistics.byLanguage = {};
    if (!statistics.firstPush) statistics.firstPush = new Date().toISOString();
    
    // Update counts
    statistics.totalSolved++;
    if (data.difficulty) {
      statistics.byDifficulty[data.difficulty] = (statistics.byDifficulty[data.difficulty] || 0) + 1;
    }
    if (data.language) {
      statistics.byLanguage[data.language] = (statistics.byLanguage[data.language] || 0) + 1;
    }
    statistics.lastPush = new Date().toISOString();
    
    await chrome.storage.local.set({ statistics });
  } catch (error) {
    console.warn('LeetHub: Could not update statistics:', error);
  }
}

/**
 * Utility: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log('LeetHub: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // First install - initialize storage
    chrome.storage.local.set({
      activityLog: [],
      githubBranch: 'main',
      githubRootFolder: 'leethub'
    });
  }
});
