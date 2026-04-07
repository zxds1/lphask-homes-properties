<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LPHASK Homes & Properties - Real Estate Management Platform

A comprehensive real estate management platform with property listings, admin panel, video tours, AI chatbot, and more.

## ✨ Features

### Public Features
- 🏠 **Property Listings** - Browse rentals and properties for sale with advanced filtering
- 🔍 **Smart Search** - Search by location, property type, price range, amenities, and status
- 📹 **Video Tours** - Watch property video tours (YouTube, Vimeo, or uploaded videos)
- 🗺️ **Google Maps Integration** - View property locations and get directions
- 💬 **AI Chatbot** - Get instant answers about properties using Gemini AI
- 📊 **Property Comparison** - Compare up to 4 properties side-by-side
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎨 **Modern UI** - Beautiful, professional design with smooth animations

### Admin Features
- 🔐 **Secure Admin Panel** - Password-protected with session management
- 🏢 **Property Management** - Edit property details, status, and upload videos
- 🔍 **Property Search & Filter** - Quickly find properties by title, location, status, or tags
- 📹 **Video Upload** - Upload video tours directly or use YouTube/Vimeo URLs
- ⚙️ **Site Configuration** - Manage site settings, contact info, and statistics
- 📊 **Homepage Statistics** - Configure properties managed, clients, experience, etc.
- 🔑 **Password Management** - Change admin password and reset via email
- 🎨 **Professional Styling** - Clean, modern admin interface

### Security Features
- 🔒 **Admin Route Protection** - Only accessible with valid authentication
- 🛡️ **Rate Limiting** - Prevents brute force attacks
- 🔐 **Secure Sessions** - HTTP-only cookies with expiration
- 📧 **Email-based Password Reset** - Secure token-based reset flow
- 🔥 **Firebase Integration** - Secure cloud data storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase project set up
- Gmail account (for email notifications)

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lphask-homes-&-properties

# Install dependencies
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Admin Configuration
ADMIN_PASSWORD=your_secure_password
ADMIN_SESSION_SECRET=random_secret_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=LPHASK Homes <noreply@lphaskhomes.com>

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Copy the credentials to your `.env.local`
6. Enable Firestore Database

### 4. Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy to `EMAIL_PASSWORD` in `.env.local`

### 5. Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run dev:client  # Frontend on port 3000
npm run dev:server  # Backend on port 4000
```

Visit `http://localhost:3000`

## 🔧 Configuration

### Admin Access

1. Click "Admin" link in the footer
2. Default password is set in `ADMIN_PASSWORD` environment variable
3. Change password immediately after first login

### Site Settings

In the Admin Panel, you can configure:
- Hero title and subtitle
- Contact information (phone, email, address)
- Office working hours
- Viewing fee
- Homepage statistics (properties managed, clients, experience, etc.)
- Admin email for password resets

### Property Management

1. **Search & Filter**: Use the search bar and status filter to find properties
2. **Edit Properties**: Select a property to edit title, location, price, description, status
3. **Video Tours**: 
   - Paste YouTube/Vimeo URL, or
   - Upload video file (MP4, WebM, OGG up to 200MB)
4. **Save Changes**: Click "Save Property" to update

### Video Tour Options

The platform supports three types of video tours:
1. **YouTube URLs** - Paste YouTube video link
2. **Vimeo URLs** - Paste Vimeo video link
3. **Uploaded Videos** - Upload MP4/WebM/OGG files directly

Videos are automatically embedded and playable in:
- Property detail view
- Admin panel preview
- Property cards (with video badge)

## 📁 Project Structure

```
lphask-homes-&-properties/
├── src/
│   ├── App.tsx              # Main application component
│   ├── components/
│   │   └── AIChatBot.tsx    # AI chatbot component
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── data/
│   ├── defaultStore.json    # Default data structure
│   └── uploads/             # Uploaded video files
├── server.ts                # Express backend server
├── .env.local               # Environment variables (create this)
├── .env.example             # Environment template
├── package.json             # Dependencies
└── README.md                # This file
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Use strong admin password** - At least 12 characters with mixed case, numbers, symbols
3. **Change default password** - Immediately after first login
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use HTTPS in production** - Never use HTTP for production
6. **Restrict CORS origins** - Only allow your domain in production

## 🚢 Deployment

### Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Add environment variables in dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all variables from `.env.example` in your hosting platform's environment settings.

Update `CORS_ORIGIN` to your production domain:
```env
CORS_ORIGIN=https://yourdomain.com
```

## 🐛 Troubleshooting

### Admin Panel Not Loading
- Check if backend server is running on port 4000
- Verify `CORS_ORIGIN` includes your frontend URL
- Check browser console for errors

### Video Upload Fails
- Ensure file is under 200MB
- Check file format (MP4, WebM, OGG only)
- Verify `data/uploads/` directory exists and is writable

### Email Not Sending
- Verify Gmail App Password is correct
- Check 2-Step Verification is enabled
- Ensure `EMAIL_SERVICE` is set to "gmail"

### Firebase Connection Issues
- Verify Firebase credentials are correct
- Check Firestore is enabled in Firebase Console
- Ensure private key includes `\n` for line breaks

## 📝 License

Apache-2.0

## 🤝 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ by TRACE Technologies**
