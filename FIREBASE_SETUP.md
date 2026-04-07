# Firebase Setup Guide for LPHASK Homes & Properties

## Current Status
You have Firebase **web config** but need **Service Account credentials** for the backend server.

## Your Firebase Project
- **Project ID**: `lphaskhomes`
- **Auth Domain**: `lphaskhomes.firebaseapp.com`

## Steps to Get Service Account Credentials

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/project/lphaskhomes/settings/serviceaccounts/adminsdk

### 2. Generate Private Key
1. Click on the **"Service accounts"** tab
2. Click **"Generate new private key"** button
3. Confirm by clicking **"Generate key"**
4. A JSON file will download (keep it secure!)

### 3. Extract Credentials from Downloaded JSON
The downloaded file will look like this:
```json
{
  "type": "service_account",
  "project_id": "lphaskhomes",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@lphaskhomes.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 4. Update Your .env.local File
Copy these three values from the downloaded JSON:

```bash
# Replace these in your .env.local:
FIREBASE_PROJECT_ID=lphaskhomes
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lphaskhomes.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**: Keep the quotes around FIREBASE_PRIVATE_KEY and preserve the `\n` characters!

### 5. Enable Firestore Database
1. Go to: https://console.firebase.google.com/project/lphaskhomes/firestore
2. Click **"Create database"**
3. Choose **"Start in production mode"** (or test mode for development)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

### 6. Set Firestore Security Rules (Important!)
Go to the **Rules** tab and use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow server-side access (via Service Account)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This ensures only your backend server (with Service Account) can access the data.

### 7. Restart Your Server
After updating `.env.local`:
```bash
npm run dev
```

You should see:
```
Firebase initialized successfully
```

Instead of:
```
Warning: Firebase configuration incomplete. Using local file storage instead.
```

## Migrate Existing Local Data to Firebase

If you have data in `data/defaultStore.json` that you want to keep:

1. Make sure Firebase is configured and server is running
2. The server will automatically upload your local data to Firebase on first run
3. Your local file will remain as a backup

## Verify Firebase Connection

After setup, check your Firestore console:
https://console.firebase.google.com/project/lphaskhomes/firestore/data

You should see a collection named `appStore` with a document named `default` containing all your properties and settings.

## Security Notes

- ✅ Never commit the Service Account JSON file to Git
- ✅ Never share your private key publicly
- ✅ The `.env.local` file is already in `.gitignore`
- ✅ Service Account credentials give full admin access to your Firebase project

## Troubleshooting

### Error: "Firebase initialization failed"
- Check that all three environment variables are set correctly
- Verify the private key includes the full `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
- Ensure quotes are around the private key value

### Error: "Permission denied"
- Make sure Firestore is enabled in your Firebase project
- Check that you're using the correct Service Account credentials

### Data not syncing
- Check server logs for Firebase errors
- Verify Firestore rules allow server-side access
- Ensure the collection name matches `FIREBASE_COLLECTION=appStore`

## Need Help?
If you encounter issues, share the server startup logs (without exposing credentials).
