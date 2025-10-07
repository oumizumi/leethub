# LeetHub

Automatically push your accepted LeetCode solutions to a GitHub repository. Built with vanilla JavaScript for Chrome Extension Manifest V3.

## 🚀 Features

- **Automatic Detection**: Monitors LeetCode for "Accepted" submissions
- **GitHub Integration**: Pushes solutions directly to your repository
- **Smart Organization**: Files are organized by difficulty: `leethub/Easy/`, `leethub/Medium/`, `leethub/Hard/`
- **Idempotent**: Won't create duplicate commits for identical code
- **Multi-language Support**: Python, Java, C++, JavaScript, TypeScript, Go, and more
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
   - **Repository Owner**: Your GitHub username (e.g., `octocat`)
   - **Repository Name**: The repo you created (e.g., `leetcode-solutions`)
   - **Branch**: `main` (or your preferred branch)
   - **Root Folder**: `leethub/` (or customize if you prefer)
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

### View Activity Log

The popup shows your last 5 actions (successful pushes or errors).

## 📂 Repository Structure

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

## 🎨 Commit Messages

LeetHub creates meaningful commit messages:

```
feat: Two Sum (Python) — Accepted

Problem: https://leetcode.com/problems/two-sum/
Runtime: 52ms
Memory: 15.2MB
Accepted at: 2025-10-07T12:34:56.789Z
```

## 🛠️ Technical Details

- **Manifest V3** Chrome Extension
- **No build tools** — pure JavaScript (ES6)
- **Service Worker** background script
- **Content Script** for LeetCode page monitoring
- **GitHub Contents API** for file management
- **MutationObserver** for SPA route detection

## ⚠️ Limitations & Known Issues

- Only works on LeetCode (not other coding platforms)
- Requires manual token setup (no OAuth flow)
- Won't auto-create GitHub repositories
- Submission detection may delay on very slow connections
- Some premium LeetCode features might not be fully supported

## 🔒 Privacy & Security

- Your GitHub token is stored **locally** in Chrome's storage (not sent anywhere except GitHub)
- No analytics, tracking, or external servers
- All communication is direct: Chrome ↔ LeetCode and Chrome ↔ GitHub

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Submit Pull Requests
- Suggest new features

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

Inspired by the original LeetHub project and the competitive programming community.

---

**Happy Coding! 🎉**

