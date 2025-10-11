/**
 * content.js - LeetCode page monitoring
 * Detects "Accepted" submissions and extracts code + metadata
 */

console.log('LeetHub content script loaded');

// Configuration
const CONFIG = {
  CHECK_INTERVAL: 1000, // Check every second
  MAX_RETRIES: 5,
  DEBOUNCE_DELAY: 2000 // Wait 2s after detecting acceptance before extracting
};

// State
let lastProcessedSubmission = null;
let isProcessing = false;

/**
 * Main initialization
 */
function init() {
  console.log('LeetHub: Initializing content script');
  console.log('LeetHub: Current URL:', window.location.href);
  
  // Check if we're on a valid page
  if (!window.location.href.includes('leetcode.com/problems/')) {
    console.log('LeetHub: Not on a problem page, watcher disabled');
    return;
  }
  
  // Watch for submission results
  setupSubmissionWatcher();
  
  // Listen for manual push requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'MANUAL_PUSH') {
      handleManualPush().then(sendResponse);
      return true; // Keep channel open for async response
    }
  });
}

/**
 * Sets up MutationObserver to watch for submission results
 */
function setupSubmissionWatcher() {
  // Use polling approach for reliability (LeetCode SPA makes DOM observation tricky)
  setInterval(() => {
    if (!isProcessing) {
      checkForAcceptedSubmission();
    }
  }, CONFIG.CHECK_INTERVAL);
  
  console.log('LeetHub: Submission watcher active');
}

/**
 * Checks if there's an accepted submission on the page
 */
async function checkForAcceptedSubmission() {
  try {
    // DOUBLE CHECK: Make sure we're on the right page and NOT on submissions history
    if (window.location.href.includes('/submissions/')) {
      // On submissions history page - don't process
      return;
    }
    
    // CRITICAL: Only process if this is a SUBMISSION result, not a test run
    // Test runs show "Accepted" for test cases - we DON'T want those
    // Real submissions show "Accepted" as the final verdict
    const isActualSubmission = checkIfActualSubmission();
    if (!isActualSubmission) {
      return; // Skip test runs
    }
    
    // Look for "Accepted" verdict
    const acceptedElement = findAcceptedVerdict();
    
    if (acceptedElement) {
      // TRIPLE CHECK: Verify no failure text on the page
      const pageText = document.body.textContent;
      if (pageText.includes('Wrong Answer') || 
          pageText.includes('Time Limit Exceeded') ||
          pageText.includes('Runtime Error') ||
          pageText.includes('Compilation Error') ||
          pageText.includes('Memory Limit Exceeded')) {
        console.log('LeetHub: Found "Accepted" text but also found failure indicators, skipping');
        return;
      }
      
      const submissionId = extractSubmissionId();
      
      // Avoid processing the same submission twice
      if (submissionId && submissionId !== lastProcessedSubmission) {
        console.log('LeetHub: ✅ Accepted submission detected!', submissionId);
        console.log('LeetHub: Waiting', CONFIG.DEBOUNCE_DELAY, 'ms for page to fully load...');
        lastProcessedSubmission = submissionId;
        isProcessing = true;
        
        // Wait a bit for the page to fully render stats
        await sleep(CONFIG.DEBOUNCE_DELAY);
        
        console.log('LeetHub: Starting extraction...');
        // Extract and push
        await extractAndPush();
        
        isProcessing = false;
      }
    }
  } catch (error) {
    console.error('LeetHub: Error checking for submission:', error);
    isProcessing = false;
  }
}

/**
 * Checks if this is an actual submission (not just a test run)
 * @returns {boolean}
 */
function checkIfActualSubmission() {
  // Look for indicators that this is a real submission result
  // Real submissions typically show:
  // - "Runtime: Xms beats Y%"
  // - "Memory: XMB beats Y%"
  // - Submission result panel
  
  const pageText = document.body.textContent;
  
  // If we see "testcase" or "Run Code" results, it's NOT a submission
  if (pageText.includes('Testcase') || 
      pageText.includes('Test case') ||
      pageText.includes('Run Code Results') ||
      pageText.includes('Case ')) {
    // Check if there's also submission result (can have both)
    // If we see "beats" percentile, it's likely a real submission
    if (!pageText.includes('beats') && !pageText.includes('Beats')) {
      console.log('LeetHub: Detected test run (not submission), skipping');
      return false;
    }
  }
  
  // Look for submission result indicators
  const submissionIndicators = [
    'beats',
    'Beats',
    'faster than',
    'less than',
    'Runtime Distribution',
    'Memory Distribution'
  ];
  
  for (const indicator of submissionIndicators) {
    if (pageText.includes(indicator)) {
      console.log('LeetHub: Detected actual submission (found:', indicator, ')');
      return true;
    }
  }
  
  // If no clear indicators, be conservative and skip
  console.log('LeetHub: Cannot confirm this is an actual submission, skipping');
  return false;
}

/**
 * Finds the "Accepted" verdict element
 * @returns {Element|null}
 */
function findAcceptedVerdict() {
  // STRICT CHECK: Only look for EXACT "Accepted" text in verdict area
  // Also check for green checkmark or success indicators
  
  const selectors = [
    '[data-e2e-locator="submission-result"]',
    '.result-message',
    '.submission-result'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent.trim();
      // STRICT: Must be exactly "Accepted" and NOT contain failure keywords
      if (text === 'Accepted' && 
          !text.includes('Wrong') && 
          !text.includes('Error') && 
          !text.includes('Exceeded') &&
          !text.includes('Failed')) {
        console.log('LeetHub: Found "Accepted" verdict using selector:', selector);
        return el;
      }
    }
  }
  
  // Look for spans/divs that ONLY contain "Accepted" (nothing else)
  const allSpans = document.querySelectorAll('span, div');
  for (const el of allSpans) {
    const text = el.textContent.trim();
    // VERY STRICT: Must be EXACTLY "Accepted" with no other text
    if (text === 'Accepted') {
      // Double check: make sure parent doesn't have failure text
      const parentText = el.parentElement?.textContent || '';
      if (!parentText.includes('Wrong') && 
          !parentText.includes('Error') && 
          !parentText.includes('Exceeded') &&
          !parentText.includes('Failed') &&
          !parentText.includes('Time Limit') &&
          !parentText.includes('Memory Limit')) {
        console.log('LeetHub: Found exact "Accepted" in:', el.tagName, el.className);
        return el;
      }
    }
  }
  
  return null;
}

/**
 * Extracts a unique identifier for the submission
 * @returns {string|null}
 */
function extractSubmissionId() {
  // Use URL + timestamp as unique ID
  const url = window.location.href;
  const timestamp = Date.now();
  return `${url}-${timestamp}`;
}

/**
 * Extracts problem metadata and code, then sends to background
 */
async function extractAndPush() {
  try {
    console.log('LeetHub: Extracting submission data...');
    
    // Check if auto-push is enabled
    const autoPushCheck = await chrome.runtime.sendMessage({ action: 'CHECK_AUTO_PUSH' });
    if (autoPushCheck && autoPushCheck.enabled === false) {
      console.log('LeetHub: Auto-push disabled, skipping');
      return;
    }
    
    let problemTitle, difficulty, language, code, problemUrl, runtime, memory;
    
    try {
      problemTitle = extractProblemTitle();
      console.log('LeetHub: Extracted title:', problemTitle);
    } catch (e) {
      console.error('LeetHub: Error extracting title:', e.message);
    }
    
    try {
      difficulty = extractDifficulty();
      console.log('LeetHub: Extracted difficulty:', difficulty);
    } catch (e) {
      console.error('LeetHub: Error extracting difficulty:', e.message);
    }
    
    try {
      language = extractLanguage();
      console.log('LeetHub: Extracted language:', language);
    } catch (e) {
      console.error('LeetHub: Error extracting language:', e.message);
    }
    
    try {
      code = extractCode();
      console.log('LeetHub: Extracted code length:', code ? code.length : 0);
    } catch (e) {
      console.error('LeetHub: Error extracting code:', e.message);
    }
    
    try {
      problemUrl = extractProblemUrl();
      console.log('LeetHub: Extracted URL:', problemUrl);
    } catch (e) {
      console.error('LeetHub: Error extracting URL:', e.message);
    }
    
    try {
      runtime = extractRuntime();
    } catch (e) {
      console.warn('LeetHub: Could not extract runtime');
    }
    
    try {
      memory = extractMemory();
    } catch (e) {
      console.warn('LeetHub: Could not extract memory');
    }
    
    if (!problemTitle || !code || !language) {
      console.error('LeetHub: Missing required data', { problemTitle, language, hasCode: !!code });
      return;
    }
    
    const payload = {
      action: 'ACCEPTED_SUBMISSION',
      data: {
        problemTitle,
        difficulty,
        language,
        code,
        problemUrl,
        runtime,
        memory,
        acceptedAt: new Date().toISOString()
      }
    };
    
    console.log('LeetHub: Sending payload to background:', payload);
    
    // Send to background script
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.error('LeetHub: Error sending message:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('LeetHub: Successfully pushed to GitHub!', response);
      } else if (response && response.error) {
        console.error('LeetHub: Error pushing to GitHub:', response.error);
      }
    });
    
  } catch (error) {
    console.error('LeetHub: Error extracting submission:', error);
    console.error('LeetHub: Error details:', error.message, error.stack);
  }
}

/**
 * Extracts problem title from the page
 * @returns {string}
 */
function extractProblemTitle() {
  const selectors = [
    '[data-cy="question-title"]',
    'div[class*="title"] a',
    'div[class*="question-title"]',
    'h1[class*="title"]',
    '.question-title',
    'a[href*="/problems/"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      // Remove problem number prefix like "1. " or "123. "
      const title = element.textContent.trim().replace(/^\d+\.\s*/, '');
      if (title) return title;
    }
  }
  
  // Fallback: extract from URL
  const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
  if (match) {
    return match[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  
  return 'Unknown Problem';
}

/**
 * Extracts difficulty level
 * @returns {string}
 */
function extractDifficulty() {
  const selectors = [
    '[diff]',
    'div[class*="difficulty"]',
    'span[class*="difficulty"]',
    '[class*="Easy"]',
    '[class*="Medium"]',
    '[class*="Hard"]'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent.trim().toLowerCase();
      if (text === 'easy' || text.includes('easy')) return 'Easy';
      if (text === 'medium' || text.includes('medium')) return 'Medium';
      if (text === 'hard' || text.includes('hard')) return 'Hard';
    }
  }
  
  return 'Unknown';
}

/**
 * Extracts selected programming language
 * @returns {string}
 */
function extractLanguage() {
  const selectors = [
    'button[id*="lang"]',
    'button[class*="lang"]',
    '[data-mode-id]',
    '.ant-select-selection-item',
    'button[aria-label*="language"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const lang = element.textContent.trim();
      if (lang && lang.length < 20) { // Sanity check
        return lang;
      }
    }
  }
  
  return 'Unknown';
}

/**
 * Extracts code from Monaco editor or DOM fallback
 * @returns {string}
 */
function extractCode() {
  console.log('LeetHub: Attempting code extraction...');
  
  // METHOD 1: Try Monaco editor API (most reliable for FULL code)
  try {
    if (typeof window !== 'undefined' && window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors && editors.length > 0) {
        // Get the main editor (usually index 0)
        const code = editors[0].getValue();
        if (code && code.trim() && code.length > 10) {
          console.log('LeetHub: ✅ Code extracted from Monaco editor (getEditors):', code.length, 'chars');
          return code;
        }
      }
      
      // Fallback: getModels
      const models = window.monaco.editor.getModels();
      if (models && models.length > 0) {
        const code = models[0].getValue();
        if (code && code.trim() && code.length > 10) {
          console.log('LeetHub: ✅ Code extracted from Monaco editor (getModels):', code.length, 'chars');
          return code;
        }
      }
    }
  } catch (error) {
    console.warn('LeetHub: Could not access Monaco editor:', error.message);
  }
  
  // METHOD 2: Try to find the visible code editor div
  try {
    const editorDiv = document.querySelector('.monaco-editor');
    if (editorDiv) {
      // Get all text content from the editor lines
      const lines = editorDiv.querySelectorAll('.view-line');
      if (lines && lines.length > 0) {
        const code = Array.from(lines).map(line => line.textContent).join('\n');
        if (code && code.trim() && code.length > 10) {
          console.log('LeetHub: ✅ Code extracted from Monaco editor DOM:', code.length, 'chars');
          return code;
        }
      }
    }
  } catch (error) {
    console.warn('LeetHub: Could not extract from Monaco DOM:', error.message);
  }
  
  // METHOD 3: Try textarea/input elements
  const codeSelectors = [
    'textarea[autocomplete="off"]',
    'textarea[class*="code"]',
    'textarea.inputarea',
    'div[class*="CodeMirror"] textarea'
  ];
  
  for (const selector of codeSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.value) {
        const code = element.value;
        if (code && code.trim() && code.length > 10) {
          console.log('LeetHub: ✅ Code extracted from textarea:', code.length, 'chars');
          return code;
        }
      }
    } catch (error) {
      console.warn('LeetHub: Error with selector', selector, error.message);
    }
  }
  
  console.error('LeetHub: ❌ Could not extract code from page');
  return '';
}

/**
 * Extracts problem URL
 * @returns {string}
 */
function extractProblemUrl() {
  return window.location.href.split('?')[0]; // Remove query params
}

/**
 * Extracts runtime stats
 * @returns {string|null}
 */
function extractRuntime() {
  const selectors = [
    '[class*="runtime"]',
    'div:contains("Runtime")',
    'span:contains("ms")'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent;
      const match = text.match(/(\d+)\s*ms/);
      if (match) {
        return match[1] + 'ms';
      }
    }
  }
  
  return null;
}

/**
 * Extracts memory usage stats
 * @returns {string|null}
 */
function extractMemory() {
  const selectors = [
    '[class*="memory"]',
    'div:contains("Memory")',
    'span:contains("MB")'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent;
      const match = text.match(/([\d.]+)\s*MB/);
      if (match) {
        return match[1] + 'MB';
      }
    }
  }
  
  return null;
}

/**
 * Handles manual push request from popup
 */
async function handleManualPush() {
  try {
    // Check if we're on a LeetCode problem page
    if (!window.location.href.includes('leetcode.com/problems/')) {
      return { success: false, error: 'Not on a LeetCode problem page' };
    }
    
    await extractAndPush();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Utility: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
