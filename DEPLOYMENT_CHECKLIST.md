# 🚀 Deployment Checklist

## ✅ Git Repository Setup - COMPLETE!

Your code is now on GitHub:
**Repository URL:** https://github.com/zxds1/lphask-homes-properties

---

## Next Steps: Deploy to Vercel

### Step 1: Go to Vercel
1. Visit: https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Find and select: `lphask-homes-properties`
3. Click "Import"

### Step 3: Configure Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- Click "Deploy" (it will fail first time - that's OK!)

### Step 4: Add Environment Variables

Go to: Settings → Environment Variables

Copy and paste these (update with your values):

```env
ADMIN_PASSWORD=your_secure_password_here
ADMIN_SESSION_SECRET=generate_random_32_char_string
ADMIN_SESSION_DURATION=3600000
CORS_ORIGIN=https://your-app.vercel.app
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_COLLECTION=appStore
FIREBASE_DOC_ID=default
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>
APP_URL=https://your-app.vercel.app
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
PORT=4000
```

### Step 5: Redeploy
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment
3. Wait 2-3 minutes
4. Your app is live! 🎉

---

## 🔥 Firebase Setup (Required)

### Quick Setup:
1. Go to: https://console.firebase.google.com/
2. Click "Add project" → Name it "lphask-homes-production"
3. Click "Firestore Database" → "Create database" → "Production mode"
4. Go to Settings (gear icon) → Service Accounts
5. Click "Generate new private key" → Download JSON
6. Copy these to Vercel environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters!)

---

## 📧 Gmail App Password (Required)

### Quick Setup:
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to: https://myaccount.google.com/apppasswords
4. Select "Mail" → "Other" → Name it "LPHASK Vercel"
5. Copy the 16-character password
6. Add to Vercel as `EMAIL_PASSWORD`

---

## 🔐 Generate Session Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

Copy the result to `ADMIN_SESSION_SECRET`

---

## ⚡ Quick Environment Variables Template

Save this and fill in your values:

```env
# === ADMIN ===
ADMIN_PASSWORD=ChangeThisPassword123!
ADMIN_SESSION_SECRET=paste_generated_secret_here
ADMIN_SESSION_DURATION=3600000

# === CORS (Update after first deploy) ===
CORS_ORIGIN=https://lphask-homes-properties.vercel.app

# === FIREBASE ===
FIREBASE_PROJECT_ID=lphask-homes-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lphask-homes-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
FIREBASE_COLLECTION=appStore
FIREBASE_DOC_ID=default

# === EMAIL ===
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>

# === APP ===
APP_URL=https://lphask-homes-properties.vercel.app
NODE_ENV=production
PORT=4000

# === AI (Optional) ===
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📋 Post-Deployment Checklist

After deployment, test these:

- [ ] Homepage loads
- [ ] Properties display
- [ ] Search works
- [ ] Filters work
- [ ] Admin login works (click "Admin" in footer)
- [ ] Can edit properties
- [ ] Video tours play
- [ ] Contact form works
- [ ] Mobile responsive
- [ ] No console errors

---

## 🐛 Common Issues & Fixes

### Issue: "Module not found"
**Fix:** All dependencies are in `dependencies` section ✅

### Issue: "Firebase authentication failed"
**Fix:** Check `FIREBASE_PRIVATE_KEY` format - must include `\n` characters

### Issue: "CORS error"
**Fix:** Update `CORS_ORIGIN` with your actual Vercel URL after first deploy

### Issue: "Admin login fails"
**Fix:** Check `ADMIN_PASSWORD` is set correctly in Vercel

### Issue: "Email not sending"
**Fix:** Verify Gmail App Password (not regular password)

---

## 🎯 Your Repository

**GitHub:** https://github.com/zxds1/lphask-homes-properties

To update after changes:
```bash
cd /home/sugho/sites/lphask-homes-\&-properties
git add .
git commit -m "Update: description of changes"
git push
```

Vercel will automatically redeploy on push!

---

## 📚 Documentation

- **VERCEL_DEPLOYMENT.md** - Complete deployment guide
- **QUICKSTART.md** - 5-minute setup guide
- **SETUP.md** - Detailed setup instructions
- **CHANGELOG.md** - All features implemented

---

## 🆘 Need Help?

1. Check VERCEL_DEPLOYMENT.md for detailed troubleshooting
2. Check Vercel logs: Dashboard → Deployments → Function Logs
3. Check browser console for frontend errors
4. Verify all environment variables are set

---

## 🎉 Success!

Once deployed, your app will be live at:
`https://lphask-homes-properties.vercel.app`

You can also add a custom domain in Vercel settings!

---

**Ready to deploy? Go to:** https://vercel.com/new

**Import from:** https://github.com/zxds1/lphask-homes-properties

Good luck! 🚀
