# LeetHub

Automatically push your accepted LeetCode solutions to a GitHub repository. Built with vanilla JavaScript for Chrome Extension Manifest V3.

## Features

- **Automatic Detection**: Monitors LeetCode for "Accepted" submissions in real-time
- **GitHub Integration**: Pushes solutions directly to your repository via GitHub API
- **Smart Organization**: Files organized by difficulty: `leethub/Easy/`, `leethub/Medium/`, `leethub/Hard/`
- **Idempotent**: Won't create duplicate commits for identical code
- **Multi-language Support**: Python, Java, C++, JavaScript, TypeScript, Go, and more
- **Desktop Notifications**: Get notified when solutions are pushed (can be toggled)
- **Statistics Tracking**: Track total problems solved, breakdown by difficulty
- **Activity Log**: View your last 10 pushes with timestamps
- **Manual Push**: Push current problem on-demand from the popup
- **Custom Commit Messages**: Optional template support with variables
- **Auto-Push Toggle**: Enable/disable automatic pushing
- **Privacy First**: Your GitHub token is stored locally in the browser

## 📋 Prerequisites

1. **A GitHub Account** with an existing repository for your solutions
2. **A Personal Access Token (PAT)** with appropriate permissions

## 🔧 Installation

### Step 1: Clone or Download this Extension

Download or clone this repository to your local machine:

```bash
git clone https://github.com/yourusername/leethub.git
cd leethub
```

### Step 2: Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name like **"LeetHub Extension"**
4. Set an expiration (or choose "No expiration" at your own risk)
5. Select scopes:
   - ✅ `public_repo` — if your solutions repo is **public**
   - ✅ `repo` (full) — if your solutions repo is **private**
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)

### Step 3: Create a GitHub Repository

Create a new repository on GitHub where your solutions will be stored. For example:
- Repository name: `leetcode-solutions`
- Public or Private (your choice)
- Don't initialize with README (LeetHub will manage the contents)

### Step 4: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `leethub-extension` folder
5. The LeetHub extension should now appear in your extensions list

### Step 5: Configure LeetHub

1. Click the LeetHub extension icon in your browser toolbar
2. Click **"Options"** or right-click the icon and select "Options"
3. Fill in the configuration:
   - **GitHub Personal Access Token**: Paste the token you created
   - **Repository Owner**: Your GitHub username (e.g., `oumizumi`)
   - **Repository Name**: The repo you created (e.g., `leetcode-solutions`)
   - **Branch**: `main` (or your preferred branch)
   - **Root Folder**: `leethub/` (or customize if you prefer)
   - **Custom Commit Message Template** (optional): Use variables like `{title}`, `{language}`, `{difficulty}`
   - **Enable Auto-Push**: ✅ (uncheck to disable automatic pushing)
   - **Enable Notifications**: ✅ (uncheck to disable desktop notifications)
   - **Debug Mode**: ❌ (check for verbose console logging)
4. Click **"Test GitHub"** to verify your connection
5. Click **"Save Settings"**

## 📖 Usage

### Automatic Submission Detection

1. Navigate to [LeetCode](https://leetcode.com/)
2. Solve a problem and submit your solution
3. When your submission is **"Accepted"**, LeetHub will automatically:
   - Extract your code, problem title, difficulty, and language
   - Push it to GitHub at: `leethub/<Difficulty>/<Problem Name>.<ext>`

### Manual Push (from Popup)

1. Open a LeetCode problem page
2. Click the LeetHub extension icon
3. Click **"Push current page"** to manually trigger a push

### View Statistics & Activity Log

1. Click the LeetHub extension icon to open the popup
2. View your statistics:
   - Total problems solved
   - Easy/Medium/Hard breakdown
3. Check recent activity log (last 10 actions)
4. Click "Refresh" to update the log

##  Repository Structure

Your GitHub repository will look like this:

```
leethub/
├── Easy/
│   ├── Two Sum.py
│   ├── Reverse String.js
│   └── Valid Parentheses.cpp
├── Medium/
│   ├── Add Two Numbers.java
│   ├── Longest Substring Without Repeating Characters.py
│   └── Container With Most Water.js
└── Hard/
    ├── Median of Two Sorted Arrays.cpp
    └── Trapping Rain Water.py
```

##  Commit Messages

LeetHub creates meaningful commit messages:

```
feat: Two Sum (Python) — Accepted

Problem: https://leetcode.com/problems/two-sum/
Runtime: 52ms
Memory: 15.2MB
Accepted at: 2025-10-07T12:34:56.789Z
```

## 🛠️ Technical Details

- **Manifest V3** Chrome Extension (latest standard)
- **No build tools** — pure vanilla JavaScript (ES6)
- **Service Worker** background script for orchestration
- **Content Script** for LeetCode page monitoring
- **GitHub Contents API** for file management
- **Polling-based detection** (checks every 1 second for accepted verdicts)
- **Monaco Editor API** for code extraction (with DOM fallback)
- **Chrome Notifications API** for desktop alerts
- **Chrome Storage API** for settings and activity log
- **Retry logic** with exponential backoff for network errors
- **Idempotency checks** to prevent duplicate commits
- **Statistics tracking** for solved problems

## ⚠️ Limitations & Known Issues

- Only works on LeetCode (not other coding platforms)
- Requires manual token setup (no OAuth flow)
- Won't auto-create GitHub repositories
- Submission detection may delay on very slow connections
- Some premium LeetCode features might not be fully supported

##  Testing the Extension

### Quick Test (5 minutes)

1. **Load the extension**:
   ```bash
   # Navigate to chrome://extensions/
   # Enable Developer mode
   # Click "Load unpacked"
   # Select /Users/oumizumi/Documents/leethub
   ```

2. **Configure settings**:
   - Right-click LeetHub icon → Options
   - Enter your GitHub credentials
   - Click "Test GitHub" (should see success message)
   - Click "Save Settings"

3. **Test on LeetCode**:
   - Go to https://leetcode.com/problems/two-sum/
   - Submit any solution
   - Wait for "Accepted" verdict
   - Check your GitHub repo - solution should appear!

4. **Verify popup**:
   - Click LeetHub icon
   - Should see statistics and activity log
   - Try "Push Current Page" button

### Troubleshooting

**Extension not detecting submissions:**
- Check browser console (F12) for errors
- Verify content script loaded: look for "LeetHub content script loaded"
- Try refreshing the LeetCode page

**GitHub push failing:**
- Verify token has correct permissions (repo/public_repo)
- Check repository exists and name is correct
- Ensure branch name matches (default: main)

**Code not extracted:**
- LeetCode may have updated their DOM structure
- Check console for "Could not extract code"
- Open an issue on GitHub with browser console logs

## Privacy & Security

- Your GitHub token is stored **locally** in Chrome's storage (not sent anywhere except GitHub)
- No analytics, tracking, or external servers
- All communication is direct: Chrome ↔ LeetCode and Chrome ↔ GitHub
- Open source - you can audit all the code

##  Development Status

**Current Version:** 1.0.0 (Complete!)  
**Completion:** 100% ✅

All core features implemented:
- ✅ Automatic LeetCode detection
- ✅ GitHub integration with retry logic
- ✅ Activity logging and statistics
- ✅ Notifications and manual push
- ✅ Custom settings and templates
- ✅ Icons and polished UI

##  Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues at https://github.com/oumizumi/leethub
- Submit Pull Requests
- Suggest new features
- Improve LeetCode selectors if they break

## 📄 License

MIT License - feel free to use and modify as needed.

