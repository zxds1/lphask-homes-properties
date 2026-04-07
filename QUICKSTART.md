# Quick Start Guide

## Immediate Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env.local
```

### 3. Configure Minimum Required Variables

Edit `.env.local` and set these **required** variables:

```env
# Admin password (change this!)
ADMIN_PASSWORD=admin123

# Session secret (generate random string)
ADMIN_SESSION_SECRET=my-secret-key-12345

# CORS (your frontend URL)
CORS_ORIGIN=http://localhost:3000

# Firebase (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Email (for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>

# Gemini AI (optional, for chatbot)
GEMINI_API_KEY=your-key-here
```

### 4. Run the Application
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### 5. Access Admin Panel

1. Open http://localhost:3000
2. Scroll to footer and click "Admin"
3. Enter your `ADMIN_PASSWORD`
4. Start managing properties!

## What's New? ✨

### Admin Panel Improvements
- ✅ **Search & Filter** - Find properties quickly by title, location, status, or tags
- ✅ **Video Upload** - Upload video files or paste YouTube/Vimeo URLs
- ✅ **Video Playback** - Videos play in property details and admin panel
- ✅ **Professional Styling** - Modern, clean admin interface with better UX
- ✅ **Statistics Config** - Edit homepage stats (properties managed, clients, etc.)
- ✅ **Fixed Homepage** - Stats section no longer overlaps buttons

### Security
- ✅ **Admin Route Hidden** - Only accessible with valid authentication
- ✅ **Session Management** - Secure cookie-based sessions
- ✅ **Password Reset** - Email-based password recovery

### Video Tours
- ✅ **Multiple Formats** - YouTube, Vimeo, or direct upload (MP4/WebM/OGG)
- ✅ **Preview in Admin** - See video before saving
- ✅ **Playback Everywhere** - Videos work in property cards and detail views

## Firebase Setup (Required)

1. Go to https://console.firebase.google.com/
2. Create new project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Copy credentials to `.env.local`
6. Enable Firestore Database in Firebase Console

## Gmail Setup (Required for Password Reset)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy to `EMAIL_PASSWORD` in `.env.local`

## Testing the Features

### Test Video Upload
1. Login to admin panel
2. Select a property
3. Scroll to "Video Tour" section
4. Either:
   - Paste YouTube URL: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Upload video file (max 200MB)
5. Click "Save Property"
6. View property on frontend to see video

### Test Search & Filter
1. Login to admin panel
2. Use search bar to find properties by name
3. Use status dropdown to filter by availability
4. Select property to edit

### Test Statistics
1. Login to admin panel
2. Scroll to "Homepage Statistics" section
3. Edit values (e.g., "500+" → "750+")
4. Click "Save All Settings"
5. Refresh homepage to see changes

## Troubleshooting

### "Cannot connect to server"
- Make sure backend is running: `npm run dev:server`
- Check port 4000 is not in use

### "Admin authentication required"
- Check `ADMIN_PASSWORD` in `.env.local`
- Clear browser cookies and try again

### "Video upload failed"
- Check file size (max 200MB)
- Verify file format (MP4, WebM, OGG only)
- Ensure `data/uploads/` directory exists

### "Email not sending"
- Verify Gmail App Password is correct
- Check 2-Step Verification is enabled
- Try different email service if Gmail doesn't work

## Next Steps

1. ✅ Change default admin password
2. ✅ Configure site settings in admin panel
3. ✅ Add/edit properties
4. ✅ Upload video tours
5. ✅ Test on mobile devices
6. ✅ Deploy to production (see SETUP.md)

## Need Help?

- Check SETUP.md for detailed documentation
- Review server.ts for API endpoints
- Check browser console for errors
- Verify all environment variables are set

---

**Happy Building! 🚀**
