<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/63a39285-1909-48fe-9d45-fd8a9d6d8dd8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the env values in [.env.local](.env.local). At minimum, configure `VITE_GEMINI_API_KEY` and the Firebase client keys.
3. Use the admin panel to change site identity, contact info, social links, services, rental ranges, and testimonials without touching code.
4. Run the app:
   `npm run dev`

## Admin Access

Firestore writes are protected by the `admin` custom claim. Assign that claim to your admin account with Firebase Admin SDK or a trusted backend before using the admin panel.

## Firebase Rules

Deploy the Firestore rules with Firebase CLI:

`firebase deploy --only firestore:rules`

Deploy the Storage rules with Firebase CLI:

`firebase deploy --only storage`

## Set Admin Claim

Use the bundled script to grant the `admin` custom claim to a Firebase user:

`ADMIN_EMAIL=admin@example.com FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json npm run set-admin-claim`

You can also provide `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` instead of `FIREBASE_SERVICE_ACCOUNT_PATH`.

Image and video uploads are stored in Firebase Storage and the resulting download URLs are saved in Firestore.
