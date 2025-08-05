@echo off
echo 🚀 NXRA InspireIQ GitHub Deployment Script
echo ==========================================
echo.

echo 📝 Step 1: Update your GitHub username in package.json
echo Please replace "your-github-username" with your actual GitHub username
echo in the homepage field of package.json
echo.

echo 📝 Step 2: Create GitHub repository
echo 1. Go to https://github.com/new
echo 2. Repository name: nxra-inspireiq
echo 3. Make it PUBLIC
echo 4. Don't initialize with README
echo.

echo 📝 Step 3: Connect to your GitHub repository
echo Replace YOUR_USERNAME in the command below:
echo git remote add origin https://github.com/YOUR_USERNAME/nxra-inspireiq.git
echo.

echo 📝 Step 4: Push to GitHub
echo git branch -M main
echo git push -u origin main
echo.

echo 📝 Step 5: Deploy to GitHub Pages
echo npm run deploy
echo.

echo 📝 Step 6: Enable GitHub Pages
echo 1. Go to your repository Settings
echo 2. Pages section
echo 3. Source: Deploy from a branch
echo 4. Select: gh-pages branch
echo 5. Save
echo.

echo 🎉 Your live URL will be:
echo https://YOUR_USERNAME.github.io/nxra-inspireiq
echo.

pause
