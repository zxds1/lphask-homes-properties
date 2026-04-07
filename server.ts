import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = path.resolve('./data');
const DEFAULT_STORE_FILE = path.join(DATA_DIR, 'defaultStore.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const FIREBASE_COLLECTION = process.env.FIREBASE_COLLECTION || 'appStore';
const FIREBASE_DOC_ID = process.env.FIREBASE_DOC_ID || 'default';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD must be set in the environment.');
}

if (!ADMIN_SESSION_SECRET) {
  throw new Error('ADMIN_SESSION_SECRET must be set in the environment.');
}

if (!CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be set in the environment. Use a comma-separated list of allowed origins.');
}

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error('Firebase configuration is required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
}

if (!EMAIL_SERVICE || !EMAIL_USER || !EMAIL_PASSWORD || !EMAIL_FROM) {
  throw new Error('Email configuration is required: EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM.');
}

const allowedOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
const ADMIN_SESSION_DURATION = Number(process.env.ADMIN_SESSION_DURATION || 1000 * 60 * 60);
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY,
  } as admin.ServiceAccount),
});

const firestore = admin.firestore();
const storeDocRef = firestore.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOC_ID);

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

const app = express();
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
    cb(null, allowed.includes(file.mimetype));
  },
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })
);

const adminSessions = new Map<string, number>();
const loginAttempts = new Map<string, number[]>();

const parseCookies = (cookieHeader?: string) => {
  return (cookieHeader || '')
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .filter(([name]) => !!name)
    .reduce<Record<string, string>>((acc, [name, ...rest]) => {
      acc[name] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
};

const getClientIp = (req: Request) => {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [token, lastUsed] of adminSessions.entries()) {
    if (now - lastUsed > ADMIN_SESSION_DURATION) {
      adminSessions.delete(token);
    }
  }
};

const recordRateLimit = (key: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  const attempts = loginAttempts.get(key) || [];
  const windowStart = now - windowMs;
  const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);
  recentAttempts.push(now);
  loginAttempts.set(key, recentAttempts);
  return recentAttempts.length <= maxRequests;
};

const createAdminToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET || '').update(rawToken).digest('hex');
};

const getAdminTokenFromRequest = (req: Request) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.adminToken;
  if (!token) return null;
  cleanExpiredSessions();
  const lastUsed = adminSessions.get(token);
  if (!lastUsed || Date.now() - lastUsed > ADMIN_SESSION_DURATION) {
    adminSessions.delete(token);
    return null;
  }
  adminSessions.set(token, Date.now());
  return token;
};

const ensureAdminAuthenticated = (req: Request, res: Response) => {
  const token = getAdminTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return false;
  }
  return true;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = (password: string, salt?: string) => {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { salt: actualSalt, hash };
};

const verifyPassword = (password: string, hash: string, salt: string) => {
  const attempted = hashPassword(password, salt);
  return attempted.hash === hash;
};

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const sendAdminResetEmail = async (recipient: string, token: string) => {
  const text = `A password reset was requested for your admin account. Use this one-time code to reset the password in the admin reset flow: ${token}. This code expires in 15 minutes.`;
  const html = `<p>A password reset was requested for your admin account.</p><p><strong>Reset code:</strong> ${token}</p><p>This code expires in 15 minutes.</p><p>If you did not request this, ignore this message.</p>`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: recipient,
    subject: 'LPHASK Admin Password Reset',
    text,
    html,
  });
};

const createEmptyStore = () => ({
  contacts: [] as any[],
  viewingRequests: [] as any[],
  infoRequests: [] as any[],
  testimonials: [] as any[],
  settings: undefined,
  properties: [] as any[],
  admin: {
    passwordHash: '',
    salt: '',
    resetTokenHash: '',
    resetExpires: 0,
  },
});

const readStore = async () => {
  const doc = await storeDocRef.get();
  if (!doc.exists) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const defaultStoreExists = await fs
      .access(DEFAULT_STORE_FILE)
      .then(() => true)
      .catch(() => false);

    const store = defaultStoreExists
      ? JSON.parse(await fs.readFile(DEFAULT_STORE_FILE, 'utf-8'))
      : createEmptyStore();

    if (!store.admin) {
      store.admin = {
        passwordHash: '',
        salt: '',
        resetTokenHash: '',
        resetExpires: 0,
      };
    }
    if (!store.settings) {
      store.settings = {};
    }
    await storeDocRef.set(store);
    return store;
  }
  return doc.data() as any;
};

const writeStore = async (store: any) => {
  await storeDocRef.set(store, { merge: false });
};

const sanitizeText = (value: string) => value.trim();

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value: string) => /^[0-9+()\s-]{7,30}$/.test(value);
const isValidTextField = (value: unknown, maxLength = 500) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;

const geminiKey = process.env.GEMINI_API_KEY;
const aiClient = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

const validateAdminString = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const sanitizeSettings = (settings: any) => {
  const allowedKeys = [
    'heroTitle',
    'heroSubtitle',
    'contactPhone',
    'contactEmail',
    'contactAddress',
    'officeWorkingHours',
    'viewingFee',
    'adminEmail',
    'propertiesManaged',
    'happyClients',
    'yearsExperience',
    'secureTransactions',
  ] as const;

  const validSettings: Record<string, string> = {};
  for (const key of allowedKeys) {
    if (!(key in settings)) continue;
    const value = settings[key];
    if (key === 'adminEmail') {
      if (typeof value === 'string' && isValidEmail(value)) {
        validSettings[key] = normalizeEmail(value);
      }
      continue;
    }
    if (typeof value === 'string') {
      validSettings[key] = sanitizeText(value);
    }
  }
  return validSettings;
};

const validatePropertyUpdates = (updates: any) => {
  const validStatuses = ['Available', 'Under Offer', 'Sold', 'Rented', 'Unavailable'];
  const updatedProperty: any = {};

  if ('title' in updates && typeof updates.title === 'string') {
    updatedProperty.title = sanitizeText(updates.title);
  }
  if ('location' in updates && typeof updates.location === 'string') {
    updatedProperty.location = sanitizeText(updates.location);
  }
  if ('description' in updates && typeof updates.description === 'string') {
    updatedProperty.description = sanitizeText(updates.description);
  }
  if ('price' in updates && typeof updates.price === 'number' && updates.price >= 0) {
    updatedProperty.price = updates.price;
  }
  if ('status' in updates && typeof updates.status === 'string' && validStatuses.includes(updates.status)) {
    updatedProperty.status = updates.status;
  }
  if ('virtualTourUrl' in updates && typeof updates.virtualTourUrl === 'string') {
    updatedProperty.virtualTourUrl = sanitizeText(updates.virtualTourUrl);
  }
  if ('videoTourUrl' in updates && typeof updates.videoTourUrl === 'string') {
    updatedProperty.videoTourUrl = sanitizeText(updates.videoTourUrl);
  }
  if ('tags' in updates && Array.isArray(updates.tags)) {
    updatedProperty.tags = updates.tags.filter((tag: any) => typeof tag === 'string').map((tag: string) => sanitizeText(tag));
  }

  return updatedProperty;
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', async (_req, res) => {
  try {
    const store = await readStore();
    return res.json({ config: store.settings, properties: store.properties });
  } catch (error) {
    console.error('Unable to load config:', error);
    return res.status(500).json({ error: 'Unable to load application configuration.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const clientIp = getClientIp(req);

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!recordRateLimit(clientIp, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const store = await readStore();
  if (!store.admin?.passwordHash || !store.admin?.salt) {
    const initial = hashPassword(ADMIN_PASSWORD);
    store.admin = {
      passwordHash: initial.hash,
      salt: initial.salt,
      resetTokenHash: '',
      resetExpires: 0,
    };
    await writeStore(store);
  }

  if (!verifyPassword(password, store.admin.passwordHash, store.admin.salt)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = createAdminToken();
  adminSessions.set(token, Date.now());
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_DURATION,
    path: '/',
  });

  return res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = getAdminTokenFromRequest(req);
  if (token) {
    adminSessions.delete(token);
  }
  res.clearCookie('adminToken', { path: '/' });
  return res.json({ success: true });
});

app.post('/api/admin/change-password', async (req, res) => {
  if (!ensureAdminAuthenticated(req, res)) {
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!validateAdminString(currentPassword) || !validateAdminString(newPassword) || newPassword.length < 8) {
    return res.status(400).json({ error: 'Current and new passwords are required. New password must be at least 8 characters.' });
  }

  const store = await readStore();
  if (!verifyPassword(currentPassword, store.admin.passwordHash, store.admin.salt)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const updated = hashPassword(newPassword);
  store.admin.passwordHash = updated.hash;
  store.admin.salt = updated.salt;
  store.admin.resetTokenHash = '';
  store.admin.resetExpires = 0;
  await writeStore(store);

  return res.json({ success: true });
});

app.post('/api/admin/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const store = await readStore();
  const adminEmail = store.settings?.adminEmail ? normalizeEmail(store.settings.adminEmail) : '';
  if (!adminEmail || normalizeEmail(email) !== adminEmail) {
    return res.status(400).json({ error: 'The reset email does not match the configured admin email.' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  store.admin.resetTokenHash = hashToken(resetToken);
  store.admin.resetExpires = Date.now() + 15 * 60 * 1000;
  await writeStore(store);

  try {
    await sendAdminResetEmail(adminEmail, resetToken);
  } catch (error) {
    console.error('Failed to send reset email:', error);
    return res.status(500).json({ error: 'Unable to send password reset email.' });
  }

  return res.json({ success: true });
});

app.post('/api/admin/complete-reset', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!isValidEmail(email) || !validateAdminString(token) || !validateAdminString(newPassword) || newPassword.length < 8) {
    return res.status(400).json({ error: 'Email, token, and a new password of at least 8 characters are required.' });
  }

  const store = await readStore();
  const adminEmail = store.settings?.adminEmail ? normalizeEmail(store.settings.adminEmail) : '';
  if (!adminEmail || normalizeEmail(email) !== adminEmail) {
    return res.status(400).json({ error: 'The provided email does not match the configured admin email.' });
  }

  if (!store.admin.resetTokenHash || !store.admin.resetExpires || Date.now() > store.admin.resetExpires) {
    return res.status(400).json({ error: 'The reset token is invalid or has expired.' });
  }

  if (hashToken(token) !== store.admin.resetTokenHash) {
    return res.status(401).json({ error: 'Invalid reset token.' });
  }

  const updated = hashPassword(newPassword);
  store.admin.passwordHash = updated.hash;
  store.admin.salt = updated.salt;
  store.admin.resetTokenHash = '';
  store.admin.resetExpires = 0;
  await writeStore(store);

  return res.json({ success: true });
});

app.post('/api/admin/settings', async (req, res) => {
  if (!ensureAdminAuthenticated(req, res)) {
    return;
  }

  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings are required.' });
  }

  const updates = sanitizeSettings(settings);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid settings provided.' });
  }

  const store = await readStore();
  store.settings = { ...store.settings, ...updates };
  await writeStore(store);

  return res.json({ success: true, settings: store.settings });
});

app.post('/api/admin/property', async (req, res) => {
  if (!ensureAdminAuthenticated(req, res)) {
    return;
  }

  const { id, updates } = req.body;
  if (!id || typeof id !== 'string' || !updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Property id and updates are required.' });
  }

  const changes = validatePropertyUpdates(updates);
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: 'No valid property updates provided.' });
  }

  const store = await readStore();
  const index = store.properties.findIndex((property: any) => property.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }

  const updatedProperty = { ...store.properties[index], ...changes };
  store.properties[index] = updatedProperty;
  await writeStore(store);

  return res.json({ success: true, property: updatedProperty });
});

app.post('/api/admin/upload-video', upload.single('video'), async (req, res) => {
  if (!ensureAdminAuthenticated(req, res)) {
    return;
  }

  const propertyId = req.body.propertyId;
  if (!propertyId || typeof propertyId !== 'string') {
    return res.status(400).json({ error: 'Property ID is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'A video file is required.' });
  }

  const extension = path.extname(req.file.originalname) || '.mp4';
  const fileName = `${req.file.filename}${extension}`;
  const targetPath = path.join(UPLOADS_DIR, fileName);

  try {
    await fs.rename(req.file.path, targetPath);
  } catch (error) {
    console.error('Unable to store uploaded video:', error);
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(500).json({ error: 'Failed to store uploaded video.' });
  }

  const videoUrl = `/uploads/${fileName}`;
  const store = await readStore();
  const index = store.properties.findIndex((property: any) => property.id === propertyId);
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }

  const updatedProperty = { ...store.properties[index], videoTourUrl: videoUrl };
  store.properties[index] = updatedProperty;
  await writeStore(store);

  return res.json({ success: true, property: updatedProperty });
});

app.post('/api/chat', async (req, res) => {
  if (!aiClient) {
    return res.status(503).json({ error: 'AI service is not configured.' });
  }

  const { message, properties } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const prompt = `You are a helpful real estate assistant for LPHASK Homes & Properties. Here is the current property inventory: ${JSON.stringify(properties || [])}. Answer the user in a concise and professional manner. User asked: ${sanitizeText(message)}`;

    const result = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    return res.json({ text: result.text || 'I am sorry, I could not generate a response.' });
  } catch (error) {
    console.error('AI request failed:', error);
    return res.status(500).json({ error: 'Unable to process request at this time.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;
  if (!isValidTextField(name, 100) || !isValidEmail(email) || !isValidTextField(message, 1000)) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and message.' });
  }

  const store = await readStore();
  store.contacts.push({
    id: `contact-${Date.now()}`,
    name: sanitizeText(name),
    email: sanitizeText(email),
    service: sanitizeText(service || ''),
    message: sanitizeText(message),
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);
  return res.json({ success: true });
});

app.post('/api/viewing-request', async (req, res) => {
  const { name, email, phone, date, time, message, propertyId, propertyTitle } = req.body;
  if (
    !isValidTextField(name, 100) ||
    !isValidEmail(email) ||
    !isValidPhone(phone) ||
    !isValidTextField(date, 50) ||
    !isValidTextField(time, 50) ||
    !isValidTextField(propertyId, 100)
  ) {
    return res.status(400).json({ error: 'Please provide valid viewing request details.' });
  }

  const store = await readStore();
  store.viewingRequests.push({
    id: `viewing-${Date.now()}`,
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone),
    date: sanitizeText(date),
    time: sanitizeText(time),
    message: sanitizeText(message || ''),
    propertyId: sanitizeText(propertyId),
    propertyTitle: sanitizeText(propertyTitle || ''),
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);
  return res.json({ success: true });
});

app.post('/api/info-request', async (req, res) => {
  const { name, email, phone, message, propertyId, propertyTitle } = req.body;
  if (
    !isValidTextField(name, 100) ||
    !isValidEmail(email) ||
    !isValidPhone(phone) ||
    !isValidTextField(propertyId, 100)
  ) {
    return res.status(400).json({ error: 'Please provide valid info request details.' });
  }

  const store = await readStore();
  store.infoRequests.push({
    id: `info-${Date.now()}`,
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone),
    message: sanitizeText(message || ''),
    propertyId: sanitizeText(propertyId),
    propertyTitle: sanitizeText(propertyTitle || ''),
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);
  return res.json({ success: true });
});

app.post('/api/testimonial', async (req, res) => {
  const { name, role, content } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required.' });
  }

  const store = await readStore();
  store.testimonials.push({
    id: `testimonial-${Date.now()}`,
    name: sanitizeText(name),
    role: sanitizeText(role || 'Client'),
    content: sanitizeText(content),
    photo: `https://picsum.photos/seed/${Date.now()}/200/200`,
    rating: 5,
    date: new Date().toISOString().split('T')[0],
  });
  await writeStore(store);
  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
