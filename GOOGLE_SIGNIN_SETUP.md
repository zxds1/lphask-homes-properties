# Google Sign-In Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Google OAuth Client ID

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **LPHASK Homes Admin**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through all steps
6. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: **LPHASK Homes Admin**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:4000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
   - Click **Create**
7. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Configure Environment Variables

Create `.env.local` file:

```env
# Admin Authentication
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=my-secret-key-12345
ADMIN_SESSION_DURATION=3600000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
ALLOWED_ADMIN_EMAILS=your-email@gmail.com

# CORS
CORS_ORIGIN=http://localhost:3000

# Firebase (use test values for now)
FIREBASE_PROJECT_ID=test-project
FIREBASE_CLIENT_EMAIL=test@test.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n"

# Email (use test values for now)
EMAIL_SERVICE=gmail
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=test
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>

# Gemini AI (optional)
GEMINI_API_KEY=your-key-here
```

Create `.env` file with same content as `.env.local`

Also add to `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 3: Run the Application

```bash
npm run dev
```

This will start:
- Backend: http://localhost:4000
- Frontend: http://localhost:3000

### Step 4: Test Google Sign-In

1. Open http://localhost:3000
2. Scroll to footer and click **"Admin"**
3. You'll see two login options:
   - **Sign in with Google** button
   - Traditional password login
4. Click **"Sign in with Google"**
5. Select your Google account
6. You're logged in! 🎉

## How It Works

### Security Features
- Only emails in `ALLOWED_ADMIN_EMAILS` can access admin panel
- If `ALLOWED_ADMIN_EMAILS` is empty, all Google accounts are allowed (for testing)
- Google verifies the user's identity
- Server validates the token
- Session created with secure cookie

### Allowed Emails
Add multiple emails separated by commas:
```env
ALLOWED_ADMIN_EMAILS=admin@lphaskhomes.com,owner@lphaskhomes.com,manager@lphaskhomes.com
```

### Production Setup
For production (Vercel):
1. Add your production domain to Google OAuth:
   - Authorized JavaScript origins: `https://your-domain.vercel.app`
   - Authorized redirect URIs: `https://your-domain.vercel.app`
2. Add environment variables in Vercel:
   - `GOOGLE_CLIENT_ID`
   - `ALLOWED_ADMIN_EMAILS`
   - `VITE_GOOGLE_CLIENT_ID` (same as GOOGLE_CLIENT_ID)

## Troubleshooting

### "Google Sign-In is not configured"
- Check `GOOGLE_CLIENT_ID` is set in `.env.local`
- Check `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the dev server

### "This Google account is not authorized"
- Add your email to `ALLOWED_ADMIN_EMAILS`
- Or remove `ALLOWED_ADMIN_EMAILS` to allow all accounts (testing only)

### "Invalid Google credentials"
- Check Client ID is correct
- Check authorized origins include `http://localhost:3000`
- Clear browser cache and try again

### Google button not showing
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set
- Restart dev server after adding env variables

## Testing Without Google OAuth

You can still use password login:
1. Click "Admin" in footer
2. Scroll down to "Or continue with password"
3. Enter your `ADMIN_PASSWORD`
4. Click "Sign In"

Both methods work simultaneously!
