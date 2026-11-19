import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AdminDashboardData,
  ContentSettings,
  GeneralSettings,
  MediaItem,
  PortfolioData,
  ProfileSettings,
  ProjectItem,
  PublishStatus,
  ServiceItem,
  SkillItem,
  SocialSettings,
} from '../src/types/portfolio.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {recursive: true});
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, {recursive: true});
}

const DB_PATH = path.join(DATA_DIR, 'portfolio.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    proficiency INTEGER NOT NULL DEFAULT 90,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    technologies TEXT NOT NULL DEFAULT '[]',
    cover_image TEXT NOT NULL DEFAULT '',
    live_url TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    section_tag TEXT NOT NULL DEFAULT 'general',
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

const DEFAULT_PROFILE: ProfileSettings = {
  name: 'Ramadan Rabie',
  title: 'Software Engineer & Web Developer',
  heroHeadline: 'Turning Ideas Into Powerful Digital Experiences.',
  heroDescription:
    'I design and develop modern, high-performance websites that help businesses build a strong digital presence, stand out, and turn visitors into customers.',
  aboutHeading: 'A LITTLE ABOUT ME',
  aboutText:
    "I'm a software engineer and web developer passionate about creating modern digital experiences. I combine clean code, creative design, and performance-focused development to build websites that help businesses grow and make a lasting impression.",
  aboutHighlights: [
    'Creative problem solving',
    'Clean code',
    'Modern UI/UX',
    'Responsive development',
    'Performance',
    'Attention to detail',
    'Turning ideas into real products',
  ],
  availabilityStatus: 'AVAILABLE FOR PROJECTS',
  availabilityActive: true,
  profileImage: '/src/assets/images/ramadan_profile_portrait_1795110499404.jpg',
  aboutImage: '/src/assets/images/about_studio_workspace_1795110499446.jpg',
  heroBgImage: '',
  primaryCtaLabel: 'View My Work',
  primaryCtaHref: '#projects',
  secondaryCtaLabel: "Let's Talk",
  secondaryCtaHref: '#contact',
};

const DEFAULT_SOCIAL: SocialSettings = {
  instagramUrl: 'https://www.instagram.com/ramadan.rabie_?knvt=MTJhdTVyMXllemZyMg==',
  facebookUrl: 'https://www.facebook.com/share/1FeiNoTDve/',
  whatsappNumber: '+20 10 44186025',
  whatsappLink: 'https://wa.me/201044186025',
  email: '',
};

const DEFAULT_CONTENT: ContentSettings = {
  navLabels: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    projects: 'Projects',
    contact: 'Contact',
  },
  servicesTitle: 'Capabilities & Engineering Services',
  servicesSubtitle:
    'Precision web engineering tailored for ambitious brands, products, and businesses seeking measurable speed and visual distinction.',
  skillsTitle: 'Core Stack & Craft',
  projectsTitle: 'Selected Client Projects',
  projectsSubtitle:
    'Real digital products and websites engineered for clients with a focus on visual clarity, speed, and conversion.',
  contactHeadline: "LET'S BUILD SOMETHING GREAT.",
  contactDescription:
    "Have an idea or a project in mind? Let's turn it into a modern digital experience. Reach out and let's discuss how we can bring your vision to life.",
  footerBio:
    'Crafting high-performance digital experiences, creative web architecture, and conversion-focused business websites.',
  footerCopyrightName: 'Ramadan Rabie',
  showLoadingScreen: true,
};

const DEFAULT_GENERAL: GeneralSettings = {
  siteTitle: 'Ramadan Rabie — Software Engineer & Web Developer',
  siteDescription:
    'I design and develop modern, high-performance websites that help businesses build a strong digital presence, stand out, and turn visitors into customers.',
  enable3DBackground: true,
  enableCustomCursor: true,
  enableFloatingWhatsApp: true,
};

const INITIAL_SERVICES: Array<Omit<ServiceItem, 'id'>> = [
  {
    title: 'Web Development',
    description:
      'End-to-end engineering of resilient, scalable websites built with clean architecture and modern standards.',
    icon: 'Code2',
    sortOrder: 0,
    isActive: true,
  },
  {
    title: 'Frontend Development',
    description:
      'Fluid, motion-driven user interfaces crafted in React and TypeScript with razor-sharp visual fidelity.',
    icon: 'Layers',
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Backend Development',
    description:
      'Secure APIs, database modeling, authentication flows, and server architecture designed for reliability.',
    icon: 'Server',
    sortOrder: 2,
    isActive: true,
  },
  {
    title: 'Responsive Web Design',
    description:
      'Adaptive layouts engineered to feel natural and effortless across desktop monitors, tablets, and mobile screens.',
    icon: 'Smartphone',
    sortOrder: 3,
    isActive: true,
  },
  {
    title: 'UI/UX Implementation',
    description:
      'Translating product vision and creative direction into intuitive user journeys, micro-interactions, and clear hierarchy.',
    icon: 'PenTool',
    sortOrder: 4,
    isActive: true,
  },
  {
    title: 'Website Optimization',
    description:
      'Core Web Vitals tuning, bundle slimming, asset delivery, and SEO foundations for instant perceived speed.',
    icon: 'Gauge',
    sortOrder: 5,
    isActive: true,
  },
  {
    title: 'Modern Web Applications',
    description:
      'Interactive full-stack dashboards, portals, and bespoke SaaS products tailored to real business workflows.',
    icon: 'Cpu',
    sortOrder: 6,
    isActive: true,
  },
  {
    title: 'Business Websites',
    description:
      'High-converting brand flagships and landing experiences built to elevate authority and turn visitors into clients.',
    icon: 'Globe',
    sortOrder: 7,
    isActive: true,
  },
];

const INITIAL_SKILLS: Array<Omit<SkillItem, 'id'>> = [
  {name: 'TypeScript', category: 'Language', proficiency: 95, sortOrder: 0},
  {name: 'React & Next.js', category: 'Frontend', proficiency: 96, sortOrder: 1},
  {name: 'Tailwind CSS', category: 'Styling', proficiency: 98, sortOrder: 2},
  {name: 'Node.js & Express', category: 'Backend', proficiency: 92, sortOrder: 3},
  {name: 'PostgreSQL & SQL', category: 'Database', proficiency: 90, sortOrder: 4},
  {name: 'Motion & GSAP', category: 'Animation', proficiency: 92, sortOrder: 5},
  {name: 'Three.js / WebGL', category: '3D & Canvas', proficiency: 86, sortOrder: 6},
  {name: 'Performance & SEO', category: 'Optimization', proficiency: 94, sortOrder: 7},
];

function getSetting<T>(key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key) as
    | {value: string}
    | undefined;
  if (!row) return fallback;
  try {
    return {...fallback, ...JSON.parse(row.value)};
  } catch {
    return fallback;
  }
}

function mapServiceRow(row: Record<string, unknown>): ServiceItem {
  const rawIcon = String(row.icon);
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    icon: rawIcon === 'Sparkles' ? 'PenTool' : rawIcon,
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
  };
}

function mapSkillRow(row: Record<string, unknown>): SkillItem {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    proficiency: Number(row.proficiency),
    sortOrder: Number(row.sort_order),
  };
}

function mapProjectRow(row: Record<string, unknown>): ProjectItem {
  let technologies: string[] = [];
  try {
    const parsed = JSON.parse(String(row.technologies || '[]'));
    if (Array.isArray(parsed)) technologies = parsed.map(String);
  } catch {
    technologies = [];
  }
  return {
    id: String(row.id),
    title: String(row.title),
    clientName: String(row.client_name || ''),
    description: String(row.description),
    category: String(row.category),
    technologies,
    coverImage: String(row.cover_image || ''),
    liveUrl: String(row.live_url),
    isFeatured: Boolean(row.is_featured),
    isPublished: Boolean(row.is_published),
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
  };
}

function mapMediaRow(row: Record<string, unknown>): MediaItem {
  return {
    id: String(row.id),
    filename: String(row.filename),
    originalName: String(row.original_name),
    url: String(row.url),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    sectionTag: (row.section_tag as MediaItem['sectionTag']) || 'general',
    isBuiltin: Boolean(row.is_builtin),
    createdAt: String(row.created_at),
  };
}

function buildWorkingPortfolioSnapshot(): PortfolioData {
  const profile = getSetting('profile', DEFAULT_PROFILE);
  const social = getSetting('social', DEFAULT_SOCIAL);
  const content = getSetting('content', DEFAULT_CONTENT);
  const general = getSetting('general', DEFAULT_GENERAL);

  const services = (
    db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC').all() as Array<
      Record<string, unknown>
    >
  ).map(mapServiceRow);

  const skills = (
    db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all() as Array<Record<string, unknown>>
  ).map(mapSkillRow);

  const projects = (
    db
      .prepare(
        'SELECT * FROM projects WHERE is_published = 1 ORDER BY is_featured DESC, sort_order ASC, created_at DESC'
      )
      .all() as Array<Record<string, unknown>>
  ).map(mapProjectRow);

  return {profile, social, content, general, services, skills, projects};
}

function seedDatabase(): void {
  const adminCount = (db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as {c: number}).c;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('Ro797979', 10);
    db.prepare(
      'INSERT INTO admin_users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
    ).run(crypto.randomUUID(), 'Ramadan', hash, new Date().toISOString());
  }

  const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
  insertSetting.run('profile', JSON.stringify(DEFAULT_PROFILE));
  insertSetting.run('social', JSON.stringify(DEFAULT_SOCIAL));
  insertSetting.run('content', JSON.stringify(DEFAULT_CONTENT));
  insertSetting.run('general', JSON.stringify(DEFAULT_GENERAL));

  const seededServices = db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get('seeded_services') as {value: string} | undefined;
  if (!seededServices) {
    const stmt = db.prepare(
      'INSERT INTO services (id, title, description, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const s of INITIAL_SERVICES) {
      stmt.run(crypto.randomUUID(), s.title, s.description, s.icon, s.sortOrder, s.isActive ? 1 : 0);
    }
    insertSetting.run('seeded_services', 'true');
  }

  // Migrate any legacy Sparkles icon in existing databases to PenTool
  db.prepare("UPDATE services SET icon = 'PenTool' WHERE icon = 'Sparkles'").run();

  const seededSkills = db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get('seeded_skills') as {value: string} | undefined;
  if (!seededSkills) {
    const stmt = db.prepare(
      'INSERT INTO skills (id, name, category, proficiency, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    for (const sk of INITIAL_SKILLS) {
      stmt.run(crypto.randomUUID(), sk.name, sk.category, sk.proficiency, sk.sortOrder);
    }
    insertSetting.run('seeded_skills', 'true');
  }

  const seededMedia = db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get('seeded_media') as {value: string} | undefined;
  if (!seededMedia) {
    const stmt = db.prepare(
      'INSERT INTO media (id, filename, original_name, url, mime_type, size_bytes, section_tag, is_builtin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const now = new Date().toISOString();
    stmt.run(
      'builtin-profile-portrait',
      'ramadan_profile_portrait_1795110499404.jpg',
      'Ramadan Studio Portrait.jpg',
      '/src/assets/images/ramadan_profile_portrait_1795110499404.jpg',
      'image/jpeg',
      142000,
      'profile',
      1,
      now
    );
    stmt.run(
      'builtin-about-workspace',
      'about_studio_workspace_1795110499446.jpg',
      'Studio Architecture Desk.jpg',
      '/src/assets/images/about_studio_workspace_1795110499446.jpg',
      'image/jpeg',
      168000,
      'about',
      1,
      now
    );
    insertSetting.run('seeded_media', 'true');
  }

  // Initialize published snapshot & publish metadata if absent
  const existingSnapshot = db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get('published_snapshot') as {value: string} | undefined;

  if (!existingSnapshot) {
    const now = new Date().toISOString();
    const initialSnapshot = buildWorkingPortfolioSnapshot();
    insertSetting.run('published_snapshot', JSON.stringify(initialSnapshot));
    insertSetting.run(
      'publish_meta',
      JSON.stringify({
        status: 'published',
        hasUnpublishedChanges: false,
        lastPublishedAt: now,
        publishedVersion: 1,
      } satisfies PublishStatus)
    );
  } else {
    // Clean any legacy Sparkles icon in snapshot services
    try {
      const snap = JSON.parse(existingSnapshot.value) as PortfolioData;
      let changed = false;
      if (Array.isArray(snap.services)) {
        snap.services = snap.services.map((s) => {
          if (s.icon === 'Sparkles') {
            changed = true;
            return {...s, icon: 'PenTool'};
          }
          return s;
        });
      }
      if (changed) {
        db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run(
          JSON.stringify(snap),
          'published_snapshot'
        );
      }
    } catch {
      // ignore
    }
  }
}

seedDatabase();

export function getPublishStatus(): PublishStatus {
  return getSetting<PublishStatus>('publish_meta', {
    status: 'published',
    hasUnpublishedChanges: false,
    lastPublishedAt: null,
    publishedVersion: 1,
  });
}

function markUnpublishedChanges(): void {
  const current = getPublishStatus();
  const next: PublishStatus = {
    ...current,
    status: 'draft',
    hasUnpublishedChanges: true,
  };
  db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run('publish_meta', JSON.stringify(next));
}

export function publishWebsite(): {publishStatus: PublishStatus; snapshot: PortfolioData} {
  const snapshot = buildWorkingPortfolioSnapshot();
  const current = getPublishStatus();
  const nextMeta: PublishStatus = {
    status: 'published',
    hasUnpublishedChanges: false,
    lastPublishedAt: new Date().toISOString(),
    publishedVersion: (current.publishedVersion || 1) + 1,
  };

  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = db.transaction(() => {
    upsert.run('published_snapshot', JSON.stringify(snapshot));
    upsert.run('publish_meta', JSON.stringify(nextMeta));
  });
  tx();

  return {publishStatus: nextMeta, snapshot};
}

export function discardDraftChanges(): AdminDashboardData {
  const published = getPublicPortfolio();
  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const currentMeta = getPublishStatus();
  const tx = db.transaction(() => {
    upsert.run('profile', JSON.stringify(published.profile));
    upsert.run('social', JSON.stringify(published.social));
    upsert.run('content', JSON.stringify(published.content));
    upsert.run('general', JSON.stringify(published.general));
    upsert.run(
      'publish_meta',
      JSON.stringify({
        ...currentMeta,
        status: 'published',
        hasUnpublishedChanges: false,
      } satisfies PublishStatus)
    );
  });
  tx();
  return getAdminDashboard();
}

export function updateSetting(key: string, value: unknown): void {
  db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value));
  markUnpublishedChanges();
}

export function getPublicPortfolio(): PortfolioData {
  const meta = getPublishStatus();
  const row = db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get('published_snapshot') as {value: string} | undefined;

  if (row) {
    try {
      const parsed = JSON.parse(row.value) as PortfolioData;
      return {
        ...parsed,
        publishedVersion: meta.publishedVersion,
        lastPublishedAt: meta.lastPublishedAt,
      };
    } catch {
      // fall through to working snapshot
    }
  }

  return {
    ...buildWorkingPortfolioSnapshot(),
    publishedVersion: meta.publishedVersion,
    lastPublishedAt: meta.lastPublishedAt,
  };
}

export function getAdminDashboard(): AdminDashboardData {
  const profile = getSetting('profile', DEFAULT_PROFILE);
  const social = getSetting('social', DEFAULT_SOCIAL);
  const content = getSetting('content', DEFAULT_CONTENT);
  const general = getSetting('general', DEFAULT_GENERAL);
  const publishStatus = getPublishStatus();

  const allServices = (
    db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all() as Array<
      Record<string, unknown>
    >
  ).map(mapServiceRow);

  const skills = (
    db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all() as Array<Record<string, unknown>>
  ).map(mapSkillRow);

  const allProjects = (
    db
      .prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC')
      .all() as Array<Record<string, unknown>>
  ).map(mapProjectRow);

  const media = (
    db.prepare('SELECT * FROM media ORDER BY created_at DESC').all() as Array<Record<string, unknown>>
  ).map(mapMediaRow);

  const publishedProjects = allProjects.filter((p) => p.isPublished);
  const activeServices = allServices.filter((s) => s.isActive);

  return {
    profile,
    social,
    content,
    general,
    services: activeServices,
    allServices,
    skills,
    projects: publishedProjects,
    allProjects,
    media,
    publishStatus,
    publishedVersion: publishStatus.publishedVersion,
    lastPublishedAt: publishStatus.lastPublishedAt,
    stats: {
      totalProjects: allProjects.length,
      publishedProjects: publishedProjects.length,
      featuredProjects: allProjects.filter((p) => p.isFeatured).length,
      totalServices: allServices.length,
      activeServices: activeServices.length,
      totalSkills: skills.length,
      totalMedia: media.length,
    },
  };
}

// Auth helpers
export function verifyAdminCredentials(username: string, password: string): boolean {
  const user = db
    .prepare('SELECT username, password_hash FROM admin_users WHERE username = ?')
    .get(username.trim()) as {username: string; password_hash: string} | undefined;
  if (!user) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): boolean {
  if (!verifyAdminCredentials(username, currentPassword)) return false;
  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(newHash, username);
  return true;
}

export function createSession(username: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  db.prepare(
    'INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(token, username, now.toISOString(), expires.toISOString());
  return token;
}

export function getSession(token: string): {username: string} | null {
  if (!token) return null;
  const row = db
    .prepare('SELECT username, expires_at FROM sessions WHERE token = ?')
    .get(token) as {username: string; expires_at: string} | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return {username: row.username};
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Projects CRUD
export function createProject(input: Omit<ProjectItem, 'id' | 'createdAt' | 'sortOrder'>): ProjectItem {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrderRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM projects').get() as {
    m: number;
  };
  const sortOrder = maxOrderRow.m + 1;

  db.prepare(
    `INSERT INTO projects
      (id, title, client_name, description, category, technologies, cover_image, live_url, is_featured, is_published, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title.trim(),
    input.clientName.trim(),
    input.description.trim(),
    input.category.trim() || 'Web Development',
    JSON.stringify(input.technologies || []),
    input.coverImage || '',
    input.liveUrl.trim(),
    input.isFeatured ? 1 : 0,
    input.isPublished ? 1 : 0,
    sortOrder,
    now
  );
  markUnpublishedChanges();
  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  return mapProjectRow(created);
}

export function updateProject(id: string, input: Partial<ProjectItem>): ProjectItem | null {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return null;
  const current = mapProjectRow(existing);

  const next: ProjectItem = {
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
  };

  db.prepare(
    `UPDATE projects SET
      title = ?, client_name = ?, description = ?, category = ?, technologies = ?,
      cover_image = ?, live_url = ?, is_featured = ?, is_published = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    next.title.trim(),
    next.clientName.trim(),
    next.description.trim(),
    next.category.trim(),
    JSON.stringify(next.technologies || []),
    next.coverImage || '',
    next.liveUrl.trim(),
    next.isFeatured ? 1 : 0,
    next.isPublished ? 1 : 0,
    next.sortOrder,
    id
  );
  markUnpublishedChanges();
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  return mapProjectRow(updated);
}

export function deleteProject(id: string): boolean {
  const info = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (info.changes > 0) markUnpublishedChanges();
  return info.changes > 0;
}

export function reorderProjects(orderedIds: string[]): void {
  const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => stmt.run(idx, id));
  });
  tx(orderedIds);
  markUnpublishedChanges();
}

// Services CRUD
export function createService(input: Omit<ServiceItem, 'id' | 'sortOrder'>): ServiceItem {
  const id = crypto.randomUUID();
  const maxOrderRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM services').get() as {
    m: number;
  };
  const sortOrder = maxOrderRow.m + 1;
  db.prepare(
    'INSERT INTO services (id, title, description, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    input.title.trim(),
    input.description.trim(),
    input.icon || 'Code2',
    sortOrder,
    input.isActive ? 1 : 0
  );
  markUnpublishedChanges();
  return mapServiceRow(
    db.prepare('SELECT * FROM services WHERE id = ?').get(id) as Record<string, unknown>
  );
}

export function updateService(id: string, input: Partial<ServiceItem>): ServiceItem | null {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return null;
  const current = mapServiceRow(existing);
  const next = {...current, ...input, id};
  db.prepare(
    'UPDATE services SET title = ?, description = ?, icon = ?, sort_order = ?, is_active = ? WHERE id = ?'
  ).run(
    next.title.trim(),
    next.description.trim(),
    next.icon || 'Code2',
    next.sortOrder,
    next.isActive ? 1 : 0,
    id
  );
  markUnpublishedChanges();
  return mapServiceRow(
    db.prepare('SELECT * FROM services WHERE id = ?').get(id) as Record<string, unknown>
  );
}

export function deleteService(id: string): boolean {
  const changed = db.prepare('DELETE FROM services WHERE id = ?').run(id).changes > 0;
  if (changed) markUnpublishedChanges();
  return changed;
}

export function reorderServices(orderedIds: string[]): void {
  const stmt = db.prepare('UPDATE services SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => stmt.run(idx, id));
  });
  tx(orderedIds);
  markUnpublishedChanges();
}

// Skills CRUD
export function createSkill(input: Omit<SkillItem, 'id' | 'sortOrder'>): SkillItem {
  const id = crypto.randomUUID();
  const maxOrderRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM skills').get() as {
    m: number;
  };
  const sortOrder = maxOrderRow.m + 1;
  db.prepare(
    'INSERT INTO skills (id, name, category, proficiency, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(id, input.name.trim(), input.category.trim() || 'Engineering', input.proficiency ?? 90, sortOrder);
  markUnpublishedChanges();
  return mapSkillRow(
    db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as Record<string, unknown>
  );
}

export function updateSkill(id: string, input: Partial<SkillItem>): SkillItem | null {
  const existing = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return null;
  const current = mapSkillRow(existing);
  const next = {...current, ...input, id};
  db.prepare(
    'UPDATE skills SET name = ?, category = ?, proficiency = ?, sort_order = ? WHERE id = ?'
  ).run(next.name.trim(), next.category.trim(), next.proficiency, next.sortOrder, id);
  markUnpublishedChanges();
  return mapSkillRow(
    db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as Record<string, unknown>
  );
}

export function deleteSkill(id: string): boolean {
  const changed = db.prepare('DELETE FROM skills WHERE id = ?').run(id).changes > 0;
  if (changed) markUnpublishedChanges();
  return changed;
}

export function reorderSkills(orderedIds: string[]): void {
  const stmt = db.prepare('UPDATE skills SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => stmt.run(idx, id));
  });
  tx(orderedIds);
  markUnpublishedChanges();
}

// Media CRUD
export function createMediaRecord(input: Omit<MediaItem, 'id' | 'createdAt'>): MediaItem {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO media (id, filename, original_name, url, mime_type, size_bytes, section_tag, is_builtin, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.filename,
    input.originalName,
    input.url,
    input.mimeType,
    input.sizeBytes,
    input.sectionTag || 'general',
    input.isBuiltin ? 1 : 0,
    now
  );
  return mapMediaRow(
    db.prepare('SELECT * FROM media WHERE id = ?').get(id) as Record<string, unknown>
  );
}

export function getMediaById(id: string): MediaItem | null {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? mapMediaRow(row) : null;
}

export function replaceMediaRecord(
  id: string,
  newFile: {filename: string; originalName: string; url: string; mimeType: string; sizeBytes: number}
): MediaItem | null {
  const existing = getMediaById(id);
  if (!existing) return null;

  const oldUrl = existing.url;

  if (!existing.isBuiltin && existing.filename) {
    const oldPath = path.join(UPLOADS_DIR, existing.filename);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch {
        // ignore disk cleanup error
      }
    }
  }

  db.prepare(
    'UPDATE media SET filename = ?, original_name = ?, url = ?, mime_type = ?, size_bytes = ?, is_builtin = 0 WHERE id = ?'
  ).run(
    newFile.filename,
    newFile.originalName,
    newFile.url,
    newFile.mimeType,
    newFile.sizeBytes,
    id
  );

  const profile = getSetting('profile', DEFAULT_PROFILE);
  let profileUpdated = false;
  if (profile.profileImage === oldUrl) {
    profile.profileImage = newFile.url;
    profileUpdated = true;
  }
  if (profile.aboutImage === oldUrl) {
    profile.aboutImage = newFile.url;
    profileUpdated = true;
  }
  if (profile.heroBgImage === oldUrl) {
    profile.heroBgImage = newFile.url;
    profileUpdated = true;
  }
  if (profileUpdated) {
    updateSetting('profile', profile);
  }
  const projUpdate = db
    .prepare('UPDATE projects SET cover_image = ? WHERE cover_image = ?')
    .run(newFile.url, oldUrl);
  if (projUpdate.changes > 0) {
    markUnpublishedChanges();
  }

  return getMediaById(id);
}

export function deleteMediaRecord(id: string): boolean {
  const existing = getMediaById(id);
  if (!existing) return false;

  if (!existing.isBuiltin && existing.filename) {
    const filePath = path.join(UPLOADS_DIR, existing.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }

  const profile = getSetting('profile', DEFAULT_PROFILE);
  let profileUpdated = false;
  if (profile.profileImage === existing.url) {
    profile.profileImage = '';
    profileUpdated = true;
  }
  if (profile.aboutImage === existing.url) {
    profile.aboutImage = '';
    profileUpdated = true;
  }
  if (profile.heroBgImage === existing.url) {
    profile.heroBgImage = '';
    profileUpdated = true;
  }
  if (profileUpdated) {
    updateSetting('profile', profile);
  }
  const projUpdate = db
    .prepare('UPDATE projects SET cover_image = ? WHERE cover_image = ?')
    .run('', existing.url);
  if (projUpdate.changes > 0) {
    markUnpublishedChanges();
  }

  return db.prepare('DELETE FROM media WHERE id = ?').run(id).changes > 0;
}

export function updateMediaSectionTag(id: string, sectionTag: MediaItem['sectionTag']): MediaItem | null {
  db.prepare('UPDATE media SET section_tag = ? WHERE id = ?').run(sectionTag, id);
  return getMediaById(id);
}
