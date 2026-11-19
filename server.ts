import 'dotenv/config';
import express, {type NextFunction, type Request, type Response} from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  UPLOADS_DIR,
  createMediaRecord,
  createProject,
  createService,
  createSession,
  createSkill,
  deleteMediaRecord,
  deleteProject,
  deleteService,
  deleteSession,
  deleteSkill,
  discardDraftChanges,
  getAdminDashboard,
  getPublicPortfolio,
  getPublishStatus,
  getSession,
  publishWebsite,
  reorderProjects,
  reorderServices,
  reorderSkills,
  replaceMediaRecord,
  updateAdminPassword,
  updateMediaSectionTag,
  updateProject,
  updateService,
  updateSetting,
  updateSkill,
  verifyAdminCredentials,
} from './server/db.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = 'rr_admin_session';

app.use(express.json({limit: '4mb'}));
app.use(cookieParser());

// Prevent stale caching across all API routes
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve uploaded images persistently
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '7d',
    fallthrough: true,
  })
);

// SSE listeners for real-time cross-device public synchronization
const sseClients = new Set<Response>();

function broadcastPublishedEvent(payload: {publishedVersion: number; lastPublishedAt: string | null}) {
  const data = `event: published\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Multer configuration for persistent image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, {recursive: true});
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)
      ? ext
      : '.png';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 10 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

function extractSessionToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  return typeof cookieToken === 'string' ? cookieToken : '';
}

interface AuthedRequest extends Request {
  adminUser?: string;
  sessionToken?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  const session = getSession(token);
  if (!session) {
    res.status(401).json({error: 'Unauthorized. Please sign in to access Settings.'});
    return;
  }
  req.adminUser = session.username;
  req.sessionToken = token;
  next();
}

// Public portfolio endpoint (always reads latest published snapshot from SQLite)
app.get('/api/portfolio', (_req, res) => {
  try {
    const data = getPublicPortfolio();
    res.json(data);
  } catch (err) {
    console.error('Error loading portfolio:', err);
    res.status(500).json({error: 'Failed to load portfolio data.'});
  }
});

// Real-time SSE stream for automatic visitor synchronization when admin publishes
app.get('/api/portfolio/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const meta = getPublishStatus();
  res.write(
    `event: version\ndata: ${JSON.stringify({
      publishedVersion: meta.publishedVersion,
      lastPublishedAt: meta.lastPublishedAt,
    })}\n\n`
  );

  sseClients.add(res);
  const keepAlive = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const {username, password} = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({error: 'Username and password are required.'});
    return;
  }
  const valid = verifyAdminCredentials(username, password);
  if (!valid) {
    res.status(401).json({error: 'Invalid username or password.'});
    return;
  }
  const token = createSession(username.trim());
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.json({authenticated: true, username: username.trim(), token});
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractSessionToken(req);
  if (token) {
    deleteSession(token);
  }
  res.clearCookie(SESSION_COOKIE, {path: '/'});
  res.json({ok: true});
});

app.get('/api/auth/me', (req, res) => {
  const token = extractSessionToken(req);
  const session = getSession(token);
  if (!session) {
    res.status(401).json({authenticated: false});
    return;
  }
  res.json({authenticated: true, username: session.username});
});

// Protected Admin Dashboard Endpoints
app.get('/api/admin/dashboard', requireAuth, (_req, res) => {
  try {
    res.json(getAdminDashboard());
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).json({error: 'Failed to load admin dashboard.'});
  }
});

// Publish Website & Broadcast to all connected visitors
app.post('/api/admin/publish', requireAuth, (_req, res) => {
  try {
    const {publishStatus} = publishWebsite();
    broadcastPublishedEvent({
      publishedVersion: publishStatus.publishedVersion,
      lastPublishedAt: publishStatus.lastPublishedAt,
    });
    res.json({ok: true, dashboard: getAdminDashboard()});
  } catch (err) {
    console.error('Publish failed:', err);
    res.status(500).json({error: 'Failed to publish website changes.'});
  }
});

// Revert unpublished draft settings back to last published snapshot
app.post('/api/admin/discard', requireAuth, (_req, res) => {
  try {
    const dashboard = discardDraftChanges();
    res.json({ok: true, dashboard});
  } catch (err) {
    console.error('Discard draft failed:', err);
    res.status(500).json({error: 'Failed to discard draft changes.'});
  }
});

app.post('/api/admin/auth/change-password', requireAuth, (req: AuthedRequest, res) => {
  const {currentPassword, newPassword} = req.body ?? {};
  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 6
  ) {
    res.status(400).json({error: 'New password must be at least 6 characters.'});
    return;
  }
  const ok = updateAdminPassword(req.adminUser || 'Ramadan', currentPassword, newPassword);
  if (!ok) {
    res.status(400).json({error: 'Current password is incorrect.'});
    return;
  }
  res.json({ok: true});
});

app.put('/api/admin/settings/:section', requireAuth, (req, res) => {
  const {section} = req.params;
  if (!['profile', 'social', 'content', 'general'].includes(section)) {
    res.status(400).json({error: 'Invalid settings section.'});
    return;
  }
  updateSetting(section, req.body);
  res.json({ok: true, data: getAdminDashboard()});
});

// Projects routes
app.post('/api/admin/projects', requireAuth, (req, res) => {
  const body = req.body ?? {};
  if (!body.title || !body.liveUrl) {
    res.status(400).json({error: 'Project title and live website URL are required.'});
    return;
  }
  const project = createProject({
    title: String(body.title),
    clientName: String(body.clientName || ''),
    description: String(body.description || ''),
    category: String(body.category || 'Web Development'),
    technologies: Array.isArray(body.technologies) ? body.technologies.map(String) : [],
    coverImage: String(body.coverImage || ''),
    liveUrl: String(body.liveUrl),
    isFeatured: Boolean(body.isFeatured),
    isPublished: body.isPublished !== false,
  });
  res.status(201).json({project, dashboard: getAdminDashboard()});
});

app.put('/api/admin/projects/:id', requireAuth, (req, res) => {
  const updated = updateProject(req.params.id, req.body ?? {});
  if (!updated) {
    res.status(404).json({error: 'Project not found.'});
    return;
  }
  res.json({project: updated, dashboard: getAdminDashboard()});
});

app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) {
    res.status(404).json({error: 'Project not found.'});
    return;
  }
  res.json({ok: true, dashboard: getAdminDashboard()});
});

app.post('/api/admin/projects/reorder', requireAuth, (req, res) => {
  const {orderedIds} = req.body ?? {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({error: 'orderedIds array is required.'});
    return;
  }
  reorderProjects(orderedIds.map(String));
  res.json({ok: true, dashboard: getAdminDashboard()});
});

// Services routes
app.post('/api/admin/services', requireAuth, (req, res) => {
  const body = req.body ?? {};
  if (!body.title) {
    res.status(400).json({error: 'Service title is required.'});
    return;
  }
  const service = createService({
    title: String(body.title),
    description: String(body.description || ''),
    icon: String(body.icon || 'Code2'),
    isActive: body.isActive !== false,
  });
  res.status(201).json({service, dashboard: getAdminDashboard()});
});

app.put('/api/admin/services/:id', requireAuth, (req, res) => {
  const updated = updateService(req.params.id, req.body ?? {});
  if (!updated) {
    res.status(404).json({error: 'Service not found.'});
    return;
  }
  res.json({service: updated, dashboard: getAdminDashboard()});
});

app.delete('/api/admin/services/:id', requireAuth, (req, res) => {
  const deleted = deleteService(req.params.id);
  if (!deleted) {
    res.status(404).json({error: 'Service not found.'});
    return;
  }
  res.json({ok: true, dashboard: getAdminDashboard()});
});

app.post('/api/admin/services/reorder', requireAuth, (req, res) => {
  const {orderedIds} = req.body ?? {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({error: 'orderedIds array is required.'});
    return;
  }
  reorderServices(orderedIds.map(String));
  res.json({ok: true, dashboard: getAdminDashboard()});
});

// Skills routes
app.post('/api/admin/skills', requireAuth, (req, res) => {
  const body = req.body ?? {};
  if (!body.name) {
    res.status(400).json({error: 'Skill name is required.'});
    return;
  }
  const skill = createSkill({
    name: String(body.name),
    category: String(body.category || 'Engineering'),
    proficiency: Number(body.proficiency ?? 90),
  });
  res.status(201).json({skill, dashboard: getAdminDashboard()});
});

app.put('/api/admin/skills/:id', requireAuth, (req, res) => {
  const updated = updateSkill(req.params.id, req.body ?? {});
  if (!updated) {
    res.status(404).json({error: 'Skill not found.'});
    return;
  }
  res.json({skill: updated, dashboard: getAdminDashboard()});
});

app.delete('/api/admin/skills/:id', requireAuth, (req, res) => {
  const deleted = deleteSkill(req.params.id);
  if (!deleted) {
    res.status(404).json({error: 'Skill not found.'});
    return;
  }
  res.json({ok: true, dashboard: getAdminDashboard()});
});

app.post('/api/admin/skills/reorder', requireAuth, (req, res) => {
  const {orderedIds} = req.body ?? {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({error: 'orderedIds array is required.'});
    return;
  }
  reorderSkills(orderedIds.map(String));
  res.json({ok: true, dashboard: getAdminDashboard()});
});

// Media upload / replace / delete routes
app.post('/api/admin/media/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({error: 'No image file provided.'});
    return;
  }
  const sectionTag = (req.body?.sectionTag || 'general') as
    | 'profile'
    | 'hero'
    | 'about'
    | 'project'
    | 'general';
  const media = createMediaRecord({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    sectionTag,
    isBuiltin: false,
  });
  res.status(201).json({media, dashboard: getAdminDashboard()});
});

app.put('/api/admin/media/:id/replace', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({error: 'No replacement image file provided.'});
    return;
  }
  const updated = replaceMediaRecord(req.params.id, {
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  });
  if (!updated) {
    res.status(404).json({error: 'Media asset not found.'});
    return;
  }
  res.json({media: updated, dashboard: getAdminDashboard()});
});

app.patch('/api/admin/media/:id', requireAuth, (req, res) => {
  const sectionTag = req.body?.sectionTag;
  const updated = updateMediaSectionTag(req.params.id, sectionTag);
  if (!updated) {
    res.status(404).json({error: 'Media asset not found.'});
    return;
  }
  res.json({media: updated, dashboard: getAdminDashboard()});
});

app.delete('/api/admin/media/:id', requireAuth, (req, res) => {
  const deleted = deleteMediaRecord(req.params.id);
  if (!deleted) {
    res.status(404).json({error: 'Media asset not found.'});
    return;
  }
  res.json({ok: true, dashboard: getAdminDashboard()});
});

// Multer error handler
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed.') {
    res.status(400).json({error: err.message});
    return;
  }
  next(err);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
