# 🔥 Firebase Setup Guide for NXRA InspireIQ

## 🚨 Current Issue
Your Firebase authentication is failing because your GitHub Pages domain is not authorized in Firebase.

## 🛠️ Firebase Console Setup Steps

### 1. **Go to Firebase Console**
Visit: https://console.firebase.google.com/project/nxrainspireiq

### 2. **Authentication Setup**
1. Click **Authentication** in the left sidebar
2. Click **Sign-in method** tab
3. Click **Google** provider
4. Make sure it's **Enabled**
5. Add your domain to **Authorized domains**

### 3. **Add Authorized Domains**
In the **Authorized domains** section, add:
```
navaniarts007.github.io
```

### 4. **Google OAuth Setup**
1. In Google provider settings
2. Make sure **Web SDK configuration** is properly set
3. Your **OAuth redirect URIs** should include:
   - `https://nxrainspireiq.firebaseapp.com/__/auth/handler`
   - `https://navaniarts007.github.io`

### 5. **Project Settings Check**
1. Go to **Project Settings** (gear icon)
2. Under **Your apps** section
3. Make sure your web app is configured with correct domain

## 🔧 Google Cloud Console
You may also need to update Google Cloud Console:

1. Go to: https://console.cloud.google.com/
2. Select your project: `nxrainspireiq`
3. Navigate to **APIs & Services** > **Credentials**
4. Find your **OAuth 2.0 Client IDs**
5. Add to **Authorized JavaScript origins**:
   ```
   https://navaniarts007.github.io
   ```
6. Add to **Authorized redirect URIs**:
   ```
   https://nxrainspireiq.firebaseapp.com/__/auth/handler
   ```

## ✅ Testing Steps
After making these changes:

1. Wait 5-10 minutes for changes to propagate
2. Clear browser cache
3. Try signing in again
4. Check browser console for any remaining errors

## 🆘 Alternative Solution
If you continue having issues, we can:
1. Create a new Firebase project with correct domain setup
2. Use a different authentication method
3. Set up a custom domain for your GitHub Pages

---
**Note**: Make sure to save all changes in Firebase Console and Google Cloud Console before testing.
