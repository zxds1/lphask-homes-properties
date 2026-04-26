#!/usr/bin/env node

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const adminEmail = process.env.ADMIN_EMAIL?.trim();

if (!adminEmail) {
  console.error('Missing ADMIN_EMAIL. Example: ADMIN_EMAIL=admin@example.com npm run set-admin-claim');
  process.exit(1);
}

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
    || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (accountPath) {
    return JSON.parse(readFileSync(resolve(accountPath), 'utf8'));
  }

  throw new Error(
    'Missing Firebase service account credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_SERVICE_ACCOUNT_JSON.'
  );
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });

  const auth = admin.auth();
  const user = await auth.getUserByEmail(adminEmail);
  const existingClaims = user.customClaims ?? {};

  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    admin: true,
  });

  console.log(`Granted admin claim to ${user.email} (${user.uid})`);
}

main().catch((error) => {
  console.error('Failed to grant admin claim:', error);
  process.exit(1);
});
