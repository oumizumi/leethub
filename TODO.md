# LeetHub Development TODO

Track remaining implementation work for the 70% to complete.

---

## 🔴 HIGH PRIORITY

### content.js — LeetCode Detection & Scraping

- [ ] Setup MutationObserver on submission result panel
- [ ] Detect "Accepted" verdict (filter out WA/TLE/CE/Errors)
- [ ] Handle LeetCode SPA route changes
- [ ] Extract problem title from DOM
  - [ ] Primary selector
  - [ ] Fallback selector
- [ ] Extract difficulty (Easy/Medium/Hard)
  - [ ] Primary selector
  - [ ] Fallback to "Unknown"
- [ ] Extract selected programming language
- [ ] Extract code from Monaco editor
  - [ ] Try `window.monaco.editor.getModels()[0].getValue()`
  - [ ] Fallback to DOM textarea/pre/code mirrors
- [ ] Extract optional metadata:
  - [ ] Problem URL
  - [ ] Runtime stats
  - [ ] Memory usage
- [ ] Build payload object
- [ ] Send message to background.js via `chrome.runtime.sendMessage()`
- [ ] Test on multiple problems and languages

### background.js — Orchestration & GitHub Push

- [ ] Setup `chrome.runtime.onMessage` listener
- [ ] Handle `ACCEPTED_SUBMISSION` message type
- [ ] Load settings from `chrome.storage.local`
  - [ ] Validate required fields exist
- [ ] Build file path: `${rootFolder}/${difficulty}/${title}.${ext}`
- [ ] Call `sanitizeTitle()` for filename
- [ ] Call `extFromLanguage()` for extension
- [ ] Encode content to base64 via `safeBase64Encode()`
- [ ] Fetch existing file SHA via `getFileSha()`
- [ ] Check idempotency (skip if content identical)
- [ ] Call `putFile()` to create/update on GitHub
- [ ] Build commit message via `buildCommitMessage()`
- [ ] Create log entry for success/failure
- [ ] Append to activity log (maintain last 5)
- [ ] Save updated log to `chrome.storage.local`
- [ ] Implement retry logic (2-3 attempts)
- [ ] Handle rate limit errors (429)
- [ ] Handle network errors (500/502/503)
- [ ] Test end-to-end with real submissions

---

## 🟡 MEDIUM PRIORITY

### popup.js — User Interface

- [ ] Load current settings on popup open
- [ ] Display repo/branch status
- [ ] Show connection indicator (green/red)
- [ ] Implement "Push Current Page" button
  - [ ] Get active tab
  - [ ] Check if on LeetCode
  - [ ] Request content script to extract data
  - [ ] Trigger background push
- [ ] Load activity log from storage
- [ ] Display last 5 actions
  - [ ] Format timestamps nicely
  - [ ] Color code success/error
  - [ ] Show problem titles
- [ ] Add refresh button for log
- [ ] Style improvements

### popup.html — UI Polish

- [ ] Improve layout
- [ ] Add icons/emoji
- [ ] Activity log list styling
- [ ] Responsive design
- [ ] Loading states

---

## 🟢 LOW PRIORITY / NICE TO HAVE

### Icons

- [ ] Create icon16.png (16x16)
- [ ] Create icon48.png (48x48)
- [ ] Create icon128.png (128x128)

### Documentation

- [ ] Add troubleshooting section to README
- [ ] Add FAQ
- [ ] Add screenshots
- [ ] Create demo video/GIF

### Features

- [ ] Support for multiple submissions (same problem, different language)
- [ ] Settings option: enable/disable auto-push
- [ ] Settings option: custom commit message template
- [ ] Notification on successful push
- [ ] Badge counter for pending pushes
- [ ] Manual sync: push all recent submissions

### Code Quality

- [ ] Add JSDoc comments to all functions
- [ ] Add error boundary in content script
- [ ] Add telemetry/analytics (privacy-safe)
- [ ] Add debug mode toggle
- [ ] Comprehensive error logging

---

## 🧪 TESTING CHECKLIST

Once implementation is complete:

- [ ] Test on Easy problem
- [ ] Test on Medium problem
- [ ] Test on Hard problem
- [ ] Test with Python code
- [ ] Test with JavaScript code
- [ ] Test with C++ code
- [ ] Test with Java code
- [ ] Test with long problem title
- [ ] Test with special characters in title
- [ ] Test duplicate submission (idempotency)
- [ ] Test with private repo
- [ ] Test with public repo
- [ ] Test invalid token (error handling)
- [ ] Test repo doesn't exist (error handling)
- [ ] Test network disconnected (error handling)
- [ ] Test GitHub rate limit (429)
- [ ] Test manual push button
- [ ] Test options page save/load
- [ ] Test activity log display
- [ ] Load extension from scratch (Load unpacked)
- [ ] Test on fresh Chrome profile

---

## 📝 NOTES

### LeetCode Selectors to Research

These will need to be found by inspecting LeetCode's DOM:

- Result panel container
- Verdict text ("Accepted", "Wrong Answer", etc.)
- Problem title element
- Difficulty badge
- Language selector dropdown
- Runtime stats element
- Memory stats element

### Potential Issues

1. **LeetCode DOM changes**: Selectors may break with updates
2. **Monaco access**: May be blocked by security policies
3. **Timing**: Result may appear before code is fully loaded
4. **Rate limiting**: GitHub API has 5000 req/hr limit (authenticated)

---

## 🚀 Ready to Continue?

Start with `content.js` — it's the most complex part but also the most interesting!

Good luck! 🎉

