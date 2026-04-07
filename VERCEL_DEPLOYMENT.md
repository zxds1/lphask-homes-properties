# Vercel Deployment Guide

## 🚀 Deploy LPHASK Homes & Properties to Vercel

This guide will walk you through deploying your application to Vercel with full functionality.

---

## Step 1: Push to GitHub

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not installed
# Visit: https://cli.github.com/

# Login to GitHub
gh auth login

# Create a new repository and push
gh repo create lphask-homes-properties --public --source=. --remote=origin --push
```

### Option B: Using GitHub Web Interface

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `lphask-homes-properties`
   - Description: "Full-featured real estate management platform"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your code:**
   ```bash
   cd /home/sugho/sites/lphask-homes-\&-properties
   git remote add origin https://github.com/YOUR_USERNAME/lphask-homes-properties.git
   git push -u origin main
   ```

---

## Step 2: Deploy to Vercel

### 1. Sign Up / Login to Vercel
- Go to https://vercel.com
- Sign up with GitHub account
- Authorize Vercel to access your repositories

### 2. Import Project
- Click "Add New..." → "Project"
- Select your GitHub repository: `lphask-homes-properties`
- Click "Import"

### 3. Configure Project Settings

**Framework Preset:** Vite

**Build & Output Settings:**
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Install Command: `npm install`

**Root Directory:** `./` (leave as default)

---

## Step 3: Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

### Required Variables

```env
# Admin Configuration
ADMIN_PASSWORD=your_secure_admin_password_here
ADMIN_SESSION_SECRET=generate_random_32_char_string_here
ADMIN_SESSION_DURATION=3600000

# CORS Configuration
CORS_ORIGIN=https://your-vercel-domain.vercel.app

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n
FIREBASE_COLLECTION=appStore
FIREBASE_DOC_ID=default

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>

# Application URL
APP_URL=https://your-vercel-domain.vercel.app

# Gemini AI (Optional - for chatbot)
GEMINI_API_KEY=your-gemini-api-key

# Node Environment
NODE_ENV=production
```

### Important Notes:

1. **FIREBASE_PRIVATE_KEY**: 
   - Copy the entire private key from Firebase
   - Keep the `\n` characters for line breaks
   - Wrap in quotes if it contains special characters
   - Example: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

2. **CORS_ORIGIN**: 
   - After first deployment, update with your actual Vercel URL
   - Format: `https://your-app-name.vercel.app`
   - Can add multiple origins separated by commas

3. **ADMIN_SESSION_SECRET**:
   - Generate a random 32+ character string
   - Use: `openssl rand -base64 32` or online generator

---

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-3 minutes)
3. Once deployed, you'll get a URL like: `https://lphask-homes-properties.vercel.app`

---

## Step 5: Post-Deployment Configuration

### 1. Update CORS_ORIGIN
- Go to Vercel Dashboard → Settings → Environment Variables
- Update `CORS_ORIGIN` with your actual Vercel URL
- Redeploy the application

### 2. Update APP_URL
- Update `APP_URL` with your Vercel URL
- Redeploy

### 3. Test Admin Access
- Visit your site
- Click "Admin" in footer
- Login with your `ADMIN_PASSWORD`
- Verify all features work

---

## Step 6: Custom Domain (Optional)

### Add Custom Domain
1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., `lphaskhomes.com`)
3. Follow DNS configuration instructions
4. Update environment variables:
   - `CORS_ORIGIN=https://lphaskhomes.com`
   - `APP_URL=https://lphaskhomes.com`
5. Redeploy

---

## Firebase Setup for Production

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: `lphask-homes-production`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location (closest to your users)
5. Click "Enable"

### 3. Get Service Account Credentials
1. Go to Project Settings (gear icon) → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Copy credentials to Vercel environment variables:
   - `FIREBASE_PROJECT_ID` → `project_id` from JSON
   - `FIREBASE_CLIENT_EMAIL` → `client_email` from JSON
   - `FIREBASE_PRIVATE_KEY` → `private_key` from JSON (keep `\n` characters)

### 4. Set Firestore Rules (Security)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appStore/{document=**} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

---

## Gmail App Password Setup

### 1. Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow setup instructions

### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter: "LPHASK Homes Vercel"
5. Click "Generate"
6. Copy the 16-character password
7. Add to Vercel as `EMAIL_PASSWORD`

---

## Troubleshooting

### Build Fails
**Error:** "Module not found"
- **Solution:** Ensure all dependencies are in `dependencies`, not `devDependencies`
- Run: `npm install` locally to verify

### Firebase Connection Error
**Error:** "Firebase authentication failed"
- **Solution:** Check `FIREBASE_PRIVATE_KEY` format
- Ensure `\n` characters are preserved
- Wrap in quotes: `"-----BEGIN PRIVATE KEY-----\n..."`

### CORS Error
**Error:** "Access blocked by CORS policy"
- **Solution:** Update `CORS_ORIGIN` with your Vercel URL
- Format: `https://your-app.vercel.app`
- Redeploy after updating

### Admin Login Fails
**Error:** "Invalid credentials"
- **Solution:** Check `ADMIN_PASSWORD` is set correctly
- Clear browser cookies
- Try incognito mode

### Video Upload Not Working
**Error:** "Upload failed"
- **Solution:** Vercel has file size limits
- Use YouTube/Vimeo URLs instead of direct uploads
- Or use external storage (AWS S3, Cloudinary)

### Email Not Sending
**Error:** "Email service unavailable"
- **Solution:** Verify Gmail App Password
- Check 2-Step Verification is enabled
- Try different email service (SendGrid, Mailgun)

---

## Performance Optimization

### 1. Enable Caching
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/uploads/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Image Optimization
- Use Vercel Image Optimization
- Replace image URLs with Vercel Image API
- Example: `/_next/image?url=...&w=800&q=75`

### 3. Enable Analytics
- Go to Vercel Dashboard → Analytics
- Enable Web Analytics
- Monitor performance and usage

---

## Security Checklist

- [ ] Strong admin password (12+ characters)
- [ ] Unique session secret (32+ characters)
- [ ] Firebase rules configured
- [ ] CORS restricted to your domain
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] Gmail App Password used (not regular password)
- [ ] Rate limiting enabled (already in code)
- [ ] No sensitive data in Git repository

---

## Monitoring & Maintenance

### 1. Check Logs
- Vercel Dashboard → Deployments → View Function Logs
- Monitor errors and performance

### 2. Update Dependencies
```bash
npm outdated
npm update
git commit -am "Update dependencies"
git push
```

### 3. Backup Data
- Export Firestore data regularly
- Go to Firebase Console → Firestore → Export

### 4. Monitor Usage
- Check Vercel usage limits
- Monitor Firebase read/write operations
- Track email sending limits

---

## Vercel Limits (Free Tier)

- **Bandwidth:** 100 GB/month
- **Serverless Function Execution:** 100 GB-hours/month
- **Builds:** 6,000 minutes/month
- **File Size:** 50 MB per file
- **Serverless Function Size:** 50 MB

**Upgrade to Pro if you exceed limits**

---

## Alternative: Deploy Backend Separately

If you need more control or exceed Vercel limits:

### Option 1: Railway
- Deploy backend to Railway.app
- Update frontend API calls to Railway URL

### Option 2: Render
- Deploy backend to Render.com
- Free tier available with limitations

### Option 3: AWS/DigitalOcean
- Deploy to VPS for full control
- More complex but unlimited

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **GitHub Issues:** Create issue in your repository
- **Vercel Support:** https://vercel.com/support

---

## Quick Commands Reference

```bash
# Push updates to GitHub
git add .
git commit -m "Update: description"
git push

# Vercel will auto-deploy on push

# Manual deploy (if needed)
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

## Success Checklist

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] Properties display with images
- [ ] Search and filters work
- [ ] Admin login works
- [ ] Can edit properties in admin panel
- [ ] Video tours play correctly
- [ ] Contact forms submit successfully
- [ ] Email notifications received
- [ ] Mobile responsive design works
- [ ] All links functional
- [ ] No console errors

---

**🎉 Congratulations! Your LPHASK Homes & Properties platform is now live!**

Share your URL: `https://your-app.vercel.app`

---

**Need Help?** Check QUICKSTART.md and SETUP.md for more details.
