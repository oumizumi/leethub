/**
 * utils.js - Helper utilities for LeetHub
 * Handles file naming, sanitization, and encoding
 */

/**
 * Sanitizes a title string for use as a filename
 * Removes forbidden filename characters: \ / : * ? " < > |
 * Trims leading/trailing whitespace
 * @param {string} str - The title to sanitize
 * @returns {string} - Sanitized filename-safe string
 */
function sanitizeTitle(str) {
  if (!str) return 'Untitled';
  
  // Remove forbidden filename characters
  let sanitized = str.replace(/[\\/:\*\?"<>\|]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized || 'Untitled';
}

/**
 * Maps programming language to file extension
 * @param {string} lang - Language name (case-insensitive)
 * @returns {string} - File extension with dot prefix
 */
function extFromLanguage(lang) {
  if (!lang) return '.txt';
  
  const langLower = lang.toLowerCase();
  
  const extensionMap = {
    'python': '.py',
    'python3': '.py',
    'java': '.java',
    'javascript': '.js',
    'typescript': '.ts',
    'c++': '.cpp',
    'cpp': '.cpp',
    'c': '.c',
    'go': '.go',
    'golang': '.go',
    'rust': '.rs',
    'kotlin': '.kt',
    'swift': '.swift',
    'ruby': '.rb',
    'php': '.php',
    'csharp': '.cs',
    'c#': '.cs',
    'scala': '.scala',
    'mysql': '.sql',
    'mssql': '.sql',
    'oraclesql': '.sql',
    'postgresql': '.sql',
    'bash': '.sh',
    'shell': '.sh'
  };
  
  return extensionMap[langLower] || '.txt';
}

/**
 * Safely encodes a UTF-8 string to Base64
 * Handles Unicode characters properly for GitHub API
 * @param {string} str - UTF-8 string to encode
 * @returns {string} - Base64 encoded string
 */
function safeBase64Encode(str) {
  // Convert UTF-8 string to byte array, then to base64
  // TextEncoder ensures proper UTF-8 encoding
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  // Convert bytes to binary string
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  // Encode to base64
  return btoa(binaryString);
}

/**
 * Decodes a Base64 string to UTF-8
 * @param {string} base64 - Base64 encoded string
 * @returns {string} - Decoded UTF-8 string
 */
function safeBase64Decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Formats a timestamp as ISO string for commit metadata
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - ISO 8601 formatted string
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Creates a log entry for the activity log
 * @param {string} status - 'success' or 'error'
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted log entry
 */
function createLogEntry(status, message, metadata = {}) {
  return {
    timestamp: formatTimestamp(),
    status,
    message,
    ...metadata
  };
}

// Export for ES6 modules (when needed)
// For Chrome extension, these are available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeTitle,
    extFromLanguage,
    safeBase64Encode,
    safeBase64Decode,
    formatTimestamp,
    createLogEntry
  };
}

