# GitHub Deployment Guide

## Repository Setup

Your Football-Throw-Game is ready to be pushed to GitHub! Follow these steps:

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `Football-Throw-Game` (or your preferred name)
5. Description: "An interactive browser-based football throwing game with timer-based gameplay"
6. Choose **Public** or **Private**
7. **DO NOT** initialize with README, .gitignore, or license (we already have these)
8. Click "Create repository"

### Step 2: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Users/dadler/Cursor Projects/Football-Throw-Game"

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Football-Throw-Game.git

# Push to GitHub
git push -u origin main
```

### Alternative: Using SSH

If you prefer SSH (and have SSH keys set up):

```bash
git remote add origin git@github.com:YOUR_USERNAME/Football-Throw-Game.git
git push -u origin main
```

## What's Included

- ✅ Complete game files (HTML, CSS, JavaScript)
- ✅ Heroku deployment configuration
- ✅ README with instructions
- ✅ .gitignore for Node.js projects

## Next Steps After Deployment

1. **Enable GitHub Pages** (optional):
   - Go to repository Settings → Pages
   - Select source branch: `main`
   - Select folder: `/ (root)`
   - Your game will be live at: `https://YOUR_USERNAME.github.io/Football-Throw-Game/`

2. **Deploy to Heroku**:
   - Install Heroku CLI
   - Run: `heroku create your-app-name`
   - Run: `git push heroku main`

## Troubleshooting

If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

If you need to update the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/Football-Throw-Game.git
```

