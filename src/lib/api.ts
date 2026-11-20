import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
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
} from '../types/portfolio.ts';
import {
  DEFAULT_CONTENT,
  DEFAULT_GENERAL,
  DEFAULT_PROFILE,
  DEFAULT_SOCIAL,
  INITIAL_MEDIA,
  INITIAL_SERVICES,
  INITIAL_SKILLS,
} from './defaults.ts';
import {db, handleFirestoreError, OperationType} from './firebase.ts';

const ADMIN_SESSION_STORAGE_KEY = 'rr_admin_session_v1';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_UPLOAD_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB input file cap

export interface StoredAdminSession {
  vaultKey: string;
  username: string;
  expiresAt: number;
}

export type UploadProgressCallback = (percent: number, stage: string) => void;

type AuthListener = (state: {ready: boolean; authenticated: boolean; username: string}) => void;
const authListeners = new Set<AuthListener>();

// ---------- Utilities & Timeout Guards ----------

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);
    promise.then(
      (val) => {
        window.clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Pure JS SHA-256 fallback in case browser runs in a non-secure HTTP LAN context without crypto.subtle
function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const utf8 = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const padded = utf8 + '\x80';
  let paddedStr = padded;
  while ((paddedStr.length % 64) - 56) paddedStr += '\x00';
  for (let i = 0; i < paddedStr.length; i++) {
    const j = paddedStr.charCodeAt(i);
    if (j >> 8) throw new Error('Invalid ASCII sequence');
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.length = 8;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return sha256Fallback(input);
}

function createCleanId(prefix: string): string {
  const raw =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`.slice(0, 120);
}

function sortProjects(items: ProjectItem[]): ProjectItem[] {
  return [...items].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function sortAdminProjects(items: ProjectItem[]): ProjectItem[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function sortByOrder<T extends {sortOrder: number}>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildSanitizedSnapshotFields(
  profile: ProfileSettings,
  social: SocialSettings,
  content: ContentSettings,
  general: GeneralSettings
) {
  return {
    profile: {
      name: String(profile.name || DEFAULT_PROFILE.name).slice(0, 120),
      title: String(profile.title || DEFAULT_PROFILE.title).slice(0, 160),
      heroHeadline: String(profile.heroHeadline || DEFAULT_PROFILE.heroHeadline).slice(0, 300),
      heroDescription: String(profile.heroDescription || '').slice(0, 1200),
      aboutHeading: String(profile.aboutHeading || DEFAULT_PROFILE.aboutHeading).slice(0, 200),
      aboutText: String(profile.aboutText || '').slice(0, 3000),
      aboutHighlights: (profile.aboutHighlights || []).slice(0, 20).map((h) => String(h)),
      availabilityStatus: String(profile.availabilityStatus || '').slice(0, 100),
      availabilityActive: Boolean(profile.availabilityActive),
      profileImage: String(profile.profileImage || '').slice(0, 800000),
      aboutImage: String(profile.aboutImage || '').slice(0, 800000),
      heroBgImage: String(profile.heroBgImage || '').slice(0, 800000),
      primaryCtaLabel: String(profile.primaryCtaLabel || '').slice(0, 80),
      primaryCtaHref: String(profile.primaryCtaHref || '').slice(0, 500),
      secondaryCtaLabel: String(profile.secondaryCtaLabel || '').slice(0, 80),
      secondaryCtaHref: String(profile.secondaryCtaHref || '').slice(0, 500),
    },
    social: {
      instagramUrl: String(social.instagramUrl || '').slice(0, 500),
      facebookUrl: String(social.facebookUrl || '').slice(0, 500),
      whatsappNumber: String(social.whatsappNumber || '').slice(0, 60),
      whatsappLink: String(social.whatsappLink || '').slice(0, 500),
      email: String(social.email || '').slice(0, 200),
    },
    content: {
      navLabels: {
        home: String(content.navLabels?.home || 'Home'),
        about: String(content.navLabels?.about || 'About'),
        services: String(content.navLabels?.services || 'Services'),
        projects: String(content.navLabels?.projects || 'Projects'),
        contact: String(content.navLabels?.contact || 'Contact'),
      },
      servicesTitle: String(content.servicesTitle || '').slice(0, 200),
      servicesSubtitle: String(content.servicesSubtitle || '').slice(0, 600),
      skillsTitle: String(content.skillsTitle || '').slice(0, 200),
      projectsTitle: String(content.projectsTitle || '').slice(0, 200),
      projectsSubtitle: String(content.projectsSubtitle || '').slice(0, 600),
      contactHeadline: String(content.contactHeadline || '').slice(0, 250),
      contactDescription: String(content.contactDescription || '').slice(0, 1000),
      footerBio: String(content.footerBio || '').slice(0, 500),
      footerCopyrightName: String(content.footerCopyrightName || '').slice(0, 120),
      showLoadingScreen: Boolean(content.showLoadingScreen),
    },
    general: {
      siteTitle: String(general.siteTitle || '').slice(0, 200),
      siteDescription: String(general.siteDescription || '').slice(0, 600),
      enable3DBackground: Boolean(general.enable3DBackground),
      enableCustomCursor: Boolean(general.enableCustomCursor),
      enableFloatingWhatsApp: Boolean(general.enableFloatingWhatsApp),
    },
  };
}

function getStoredAdminSession(): StoredAdminSession | null {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAdminSession>;
    if (
      !parsed ||
      typeof parsed.vaultKey !== 'string' ||
      !/^[a-f0-9]{64}$/.test(parsed.vaultKey) ||
      typeof parsed.username !== 'string' ||
      !parsed.username ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }
    return parsed as StoredAdminSession;
  } catch {
    return null;
  }
}

function saveAdminSession(session: StoredAdminSession): void {
  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  authListeners.forEach((listener) =>
    listener({ready: true, authenticated: true, username: session.username})
  );
}

function clearAdminSession(): void {
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  authListeners.forEach((listener) => listener({ready: true, authenticated: false, username: ''}));
}

function requireActiveSession(): StoredAdminSession {
  const session = getStoredAdminSession();
  if (!session) {
    throw new Error('Your admin session has expired. Please sign in again.');
  }
  return session;
}

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as {code?: string}).code;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    code === 'permission-denied' ||
    msg.toLowerCase().includes('missing or insufficient permissions') ||
    msg.toLowerCase().includes('permission_denied')
  );
}

function attachGateProof(batch: ReturnType<typeof writeBatch>, session: StoredAdminSession) {
  batch.set(doc(db, 'admin_gate', 'auth_proof'), {
    vaultKey: session.vaultKey,
    username: session.username,
    timestamp: serverTimestamp(),
  });
}

// ---------- Public Portfolio Read + Real-Time Subscription ----------

export async function fetchPublicPortfolio(): Promise<PortfolioData> {
  let publicDocData: Partial<PortfolioData> | null = null;
  try {
    const snap = await withTimeout(
      getDoc(doc(db, 'portfolio_public', 'live')),
      REQUEST_TIMEOUT_MS,
      'Timed out loading portfolio configuration.'
    );
    if (snap.exists()) {
      publicDocData = snap.data() as Partial<PortfolioData>;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portfolio_public/live');
  }

  let projects: ProjectItem[] = [];
  try {
    const q = query(collection(db, 'projects'), where('isPublished', '==', true));
    const snap = await withTimeout(
      getDocs(q),
      REQUEST_TIMEOUT_MS,
      'Timed out loading portfolio projects.'
    );
    projects = sortProjects(snap.docs.map((d) => d.data() as ProjectItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  }

  let services: ServiceItem[] = [];
  try {
    const q = query(collection(db, 'services'), where('isActive', '==', true));
    const snap = await withTimeout(
      getDocs(q),
      REQUEST_TIMEOUT_MS,
      'Timed out loading services.'
    );
    services = sortByOrder(snap.docs.map((d) => d.data() as ServiceItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
  }

  let skills: SkillItem[] = [];
  try {
    const snap = await withTimeout(
      getDocs(collection(db, 'skills')),
      REQUEST_TIMEOUT_MS,
      'Timed out loading skills.'
    );
    skills = sortByOrder(snap.docs.map((d) => d.data() as SkillItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'skills');
  }

  return {
    profile: {...DEFAULT_PROFILE, ...(publicDocData?.profile || {})},
    social: {...DEFAULT_SOCIAL, ...(publicDocData?.social || {})},
    content: {
      ...DEFAULT_CONTENT,
      ...(publicDocData?.content || {}),
      navLabels: {...DEFAULT_CONTENT.navLabels, ...(publicDocData?.content?.navLabels || {})},
    },
    general: {...DEFAULT_GENERAL, ...(publicDocData?.general || {})},
    services: publicDocData || services.length > 0 ? services : INITIAL_SERVICES,
    skills: publicDocData || skills.length > 0 ? skills : INITIAL_SKILLS,
    projects,
    publishedVersion: publicDocData?.publishedVersion ?? 1,
    lastPublishedAt: publicDocData?.lastPublishedAt ?? null,
  };
}

export function subscribePublicPortfolio(
  onUpdate: (data: PortfolioData) => void,
  onError: (err: Error) => void
): () => void {
  let publicDoc: Partial<PortfolioData> | null = null;
  let projects: ProjectItem[] = [];
  let services: ServiceItem[] = INITIAL_SERVICES;
  let skills: SkillItem[] = INITIAL_SKILLS;
  let hasPublicLoaded = false;

  const emit = () => {
    if (!hasPublicLoaded) return;
    onUpdate({
      profile: {...DEFAULT_PROFILE, ...(publicDoc?.profile || {})},
      social: {...DEFAULT_SOCIAL, ...(publicDoc?.social || {})},
      content: {
        ...DEFAULT_CONTENT,
        ...(publicDoc?.content || {}),
        navLabels: {...DEFAULT_CONTENT.navLabels, ...(publicDoc?.content?.navLabels || {})},
      },
      general: {...DEFAULT_GENERAL, ...(publicDoc?.general || {})},
      services,
      skills,
      projects,
      publishedVersion: publicDoc?.publishedVersion ?? 1,
      lastPublishedAt: publicDoc?.lastPublishedAt ?? null,
    });
  };

  const unsubPublic = onSnapshot(
    doc(db, 'portfolio_public', 'live'),
    (snap) => {
      publicDoc = snap.exists() ? (snap.data() as Partial<PortfolioData>) : null;
      hasPublicLoaded = true;
      emit();
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, 'portfolio_public/live');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubProjects = onSnapshot(
    query(collection(db, 'projects'), where('isPublished', '==', true)),
    (snap) => {
      projects = sortProjects(snap.docs.map((d) => d.data() as ProjectItem));
      emit();
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'projects');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubServices = onSnapshot(
    query(collection(db, 'services'), where('isActive', '==', true)),
    (snap) => {
      const loaded = sortByOrder(snap.docs.map((d) => d.data() as ServiceItem));
      services = loaded.length > 0 || publicDoc ? loaded : INITIAL_SERVICES;
      emit();
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'services');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubSkills = onSnapshot(
    collection(db, 'skills'),
    (snap) => {
      const loaded = sortByOrder(snap.docs.map((d) => d.data() as SkillItem));
      skills = loaded.length > 0 || publicDoc ? loaded : INITIAL_SKILLS;
      emit();
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'skills');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubPublic();
    unsubProjects();
    unsubServices();
    unsubSkills();
  };
}

// ---------- Username & Password Authentication (No Email / No Google OAuth) ----------

export function subscribeAuthState(callback: AuthListener): () => void {
  authListeners.add(callback);

  let cancelled = false;
  const session = getStoredAdminSession();

  if (!session) {
    callback({ready: true, authenticated: false, username: ''});
  } else {
    // Verify stored vault key against Firestore gate before trusting persistent session
    withTimeout(
      setDoc(doc(db, 'admin_gate', 'auth_proof'), {
        vaultKey: session.vaultKey,
        username: session.username,
        timestamp: serverTimestamp(),
      }),
      REQUEST_TIMEOUT_MS,
      'Session verification timed out.'
    )
      .then(() => {
        if (!cancelled) {
          callback({ready: true, authenticated: true, username: session.username});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (isPermissionDenied(err)) {
          window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          callback({ready: true, authenticated: false, username: ''});
        } else {
          // Transient offline state: preserve local session so retry works on SettingsPage
          callback({ready: true, authenticated: true, username: session.username});
        }
      });
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_SESSION_STORAGE_KEY) {
      const next = getStoredAdminSession();
      callback({
        ready: true,
        authenticated: Boolean(next),
        username: next?.username || '',
      });
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    cancelled = true;
    authListeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export async function loginAdminWithCredentials(
  username: string,
  password: string
): Promise<string> {
  const cleanUser = username.trim();
  if (!cleanUser || !password) {
    throw new Error('Please enter both username and password.');
  }

  const vaultKey = await sha256Hex(`ramadan-vault-v1:${cleanUser}:${password}`);

  try {
    await withTimeout(
      setDoc(doc(db, 'admin_gate', 'auth_proof'), {
        vaultKey,
        username: cleanUser,
        timestamp: serverTimestamp(),
      }),
      REQUEST_TIMEOUT_MS,
      'Authentication request timed out. Please check your connection and try again.'
    );
  } catch (err) {
    if (isPermissionDenied(err)) {
      throw new Error('Incorrect username or password.');
    }
    throw new Error(
      err instanceof Error ? err.message : 'Unable to reach authentication server.'
    );
  }

  const session: StoredAdminSession = {
    vaultKey,
    username: cleanUser,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  saveAdminSession(session);
  return cleanUser;
}

export async function logoutAdmin(): Promise<void> {
  clearAdminSession();
}

// ---------- Admin Initial Seeding & Dashboard Fetch ----------

function vaultDoc(vaultKey: string, colName: string, docId: string) {
  return doc(db, 'admin_vault', vaultKey, colName, docId);
}

function vaultCol(vaultKey: string, colName: string) {
  return collection(db, 'admin_vault', vaultKey, colName);
}

async function ensureFirestoreInitialized(session: StoredAdminSession): Promise<void> {
  const now = new Date().toISOString();
  const {vaultKey} = session;
  const draftRef = vaultDoc(vaultKey, 'draft', 'current');
  const pubRef = doc(db, 'portfolio_public', 'live');

  let draftExists = false;
  try {
    const draftSnap = await withTimeout(
      getDoc(draftRef),
      REQUEST_TIMEOUT_MS,
      'Timed out loading admin draft.'
    );
    draftExists = draftSnap.exists();
  } catch (error) {
    if (isPermissionDenied(error)) {
      clearAdminSession();
      throw new Error('Session is no longer valid. Please log in again.');
    }
    handleFirestoreError(error, OperationType.GET, 'admin_vault/draft/current');
  }

  if (draftExists) return;

  // Check if portfolio_public/live already exists to preserve any live site data
  let existingPublic: Partial<PortfolioData> | null = null;
  try {
    const pubSnap = await getDoc(pubRef);
    if (pubSnap.exists()) {
      existingPublic = pubSnap.data() as Partial<PortfolioData>;
    }
  } catch {
    existingPublic = null;
  }

  const baseFields = buildSanitizedSnapshotFields(
    {...DEFAULT_PROFILE, ...(existingPublic?.profile || {})},
    {...DEFAULT_SOCIAL, ...(existingPublic?.social || {})},
    {
      ...DEFAULT_CONTENT,
      ...(existingPublic?.content || {}),
      navLabels: {...DEFAULT_CONTENT.navLabels, ...(existingPublic?.content?.navLabels || {})},
    },
    {...DEFAULT_GENERAL, ...(existingPublic?.general || {})}
  );

  const batch = writeBatch(db);
  attachGateProof(batch, session);

  if (!existingPublic) {
    batch.set(pubRef, {
      ...baseFields,
      publishedVersion: 1,
      lastPublishedAt: now,
    });
  }

  batch.set(draftRef, {
    ...baseFields,
    publishMeta: {
      status: 'published',
      hasUnpublishedChanges: false,
      lastPublishedAt: existingPublic?.lastPublishedAt ?? now,
      publishedVersion: existingPublic?.publishedVersion ?? 1,
    } satisfies PublishStatus,
  });

  // Seed initial media into private admin vault
  const existingMedia = await getDocs(vaultCol(vaultKey, 'media'));
  if (existingMedia.empty) {
    for (const m of INITIAL_MEDIA) {
      batch.set(vaultDoc(vaultKey, 'media', m.id), m);
    }
  }

  // Sync existing public services or seed INITIAL_SERVICES
  const existingVaultServices = await getDocs(vaultCol(vaultKey, 'services'));
  if (existingVaultServices.empty) {
    const pubServices = await getDocs(query(collection(db, 'services'), where('isActive', '==', true)));
    const sourceServices = pubServices.empty
      ? INITIAL_SERVICES
      : pubServices.docs.map((d) => d.data() as ServiceItem);
    for (const svc of sourceServices) {
      batch.set(vaultDoc(vaultKey, 'services', svc.id), svc);
      if (pubServices.empty && svc.isActive) {
        batch.set(doc(db, 'services', svc.id), svc);
      }
    }
  }

  // Sync existing public skills or seed INITIAL_SKILLS
  const existingVaultSkills = await getDocs(vaultCol(vaultKey, 'skills'));
  if (existingVaultSkills.empty) {
    const pubSkills = await getDocs(collection(db, 'skills'));
    const sourceSkills = pubSkills.empty
      ? INITIAL_SKILLS
      : pubSkills.docs.map((d) => d.data() as SkillItem);
    for (const sk of sourceSkills) {
      batch.set(vaultDoc(vaultKey, 'skills', sk.id), sk);
      if (pubSkills.empty) {
        batch.set(doc(db, 'skills', sk.id), sk);
      }
    }
  }

  // Sync any existing published projects into vault
  const existingVaultProjects = await getDocs(vaultCol(vaultKey, 'projects'));
  if (existingVaultProjects.empty) {
    const pubProjects = await getDocs(query(collection(db, 'projects'), where('isPublished', '==', true)));
    for (const pDoc of pubProjects.docs) {
      const p = pDoc.data() as ProjectItem;
      batch.set(vaultDoc(vaultKey, 'projects', p.id), p);
    }
  }

  try {
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out initializing portfolio database.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial-vault-seed');
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  await ensureFirestoreInitialized(session);
  const {vaultKey} = session;

  let draftData: {
    profile: ProfileSettings;
    social: SocialSettings;
    content: ContentSettings;
    general: GeneralSettings;
    publishMeta: PublishStatus;
  };
  try {
    const draftSnap = await withTimeout(
      getDoc(vaultDoc(vaultKey, 'draft', 'current')),
      REQUEST_TIMEOUT_MS,
      'Timed out loading draft settings.'
    );
    draftData = draftSnap.data() as typeof draftData;
  } catch (error) {
    if (isPermissionDenied(error)) {
      clearAdminSession();
      throw new Error('Unauthorized session. Please sign in again.');
    }
    handleFirestoreError(error, OperationType.GET, 'admin_vault/draft/current');
  }

  let allProjects: ProjectItem[] = [];
  try {
    const snap = await getDocs(vaultCol(vaultKey, 'projects'));
    allProjects = sortAdminProjects(snap.docs.map((d) => d.data() as ProjectItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_vault/projects');
  }

  let allServices: ServiceItem[] = [];
  try {
    const snap = await getDocs(vaultCol(vaultKey, 'services'));
    allServices = sortByOrder(snap.docs.map((d) => d.data() as ServiceItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_vault/services');
  }

  let skills: SkillItem[] = [];
  try {
    const snap = await getDocs(vaultCol(vaultKey, 'skills'));
    skills = sortByOrder(snap.docs.map((d) => d.data() as SkillItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_vault/skills');
  }

  let media: MediaItem[] = [];
  try {
    const snap = await getDocs(vaultCol(vaultKey, 'media'));
    media = snap.docs
      .map((d) => d.data() as MediaItem)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_vault/media');
  }

  const publishedProjects = allProjects.filter((p) => p.isPublished);
  const activeServices = allServices.filter((s) => s.isActive);

  return {
    profile: {...DEFAULT_PROFILE, ...(draftData?.profile || {})},
    social: {...DEFAULT_SOCIAL, ...(draftData?.social || {})},
    content: {
      ...DEFAULT_CONTENT,
      ...(draftData?.content || {}),
      navLabels: {...DEFAULT_CONTENT.navLabels, ...(draftData?.content?.navLabels || {})},
    },
    general: {...DEFAULT_GENERAL, ...(draftData?.general || {})},
    services: activeServices,
    allServices,
    skills,
    projects: publishedProjects,
    allProjects,
    media,
    publishStatus: draftData?.publishMeta || {
      status: 'published',
      hasUnpublishedChanges: false,
      lastPublishedAt: null,
      publishedVersion: 1,
    },
    publishedVersion: draftData?.publishMeta?.publishedVersion ?? 1,
    lastPublishedAt: draftData?.publishMeta?.lastPublishedAt ?? null,
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

async function markDraftModified(
  session: StoredAdminSession,
  overrides?: Partial<{
    profile: ProfileSettings;
    social: SocialSettings;
    content: ContentSettings;
    general: GeneralSettings;
  }>
): Promise<void> {
  const draftRef = vaultDoc(session.vaultKey, 'draft', 'current');
  const snap = await getDoc(draftRef);
  const current = snap.data() as {
    profile: ProfileSettings;
    social: SocialSettings;
    content: ContentSettings;
    general: GeneralSettings;
    publishMeta: PublishStatus;
  };
  const nextFields = buildSanitizedSnapshotFields(
    overrides?.profile ?? current.profile,
    overrides?.social ?? current.social,
    overrides?.content ?? current.content,
    overrides?.general ?? current.general
  );
  const payload = {
    ...nextFields,
    publishMeta: {
      status: 'draft',
      hasUnpublishedChanges: true,
      lastPublishedAt: current.publishMeta?.lastPublishedAt ?? null,
      publishedVersion: current.publishMeta?.publishedVersion ?? 1,
    } satisfies PublishStatus,
  };
  const estimatedSize = JSON.stringify(payload).length;
  if (estimatedSize > 940000) {
    throw new Error(
      'Combined image sizes for Profile, About, and Hero exceed database document limits. Please replace one with a smaller image.'
    );
  }
  await withTimeout(setDoc(draftRef, payload), REQUEST_TIMEOUT_MS, 'Timed out saving draft changes.');
}

// ---------- Settings Save / Publish / Discard ----------

export async function saveSettingsSection<T>(
  section: 'profile' | 'social' | 'content' | 'general',
  data: T
): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    await markDraftModified(session, {[section]: data});
  } catch (error) {
    if (isPermissionDenied(error)) {
      clearAdminSession();
      throw new Error('Unauthorized session. Please log in again.');
    }
    if (error instanceof Error && error.message.includes('Combined image sizes')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, 'admin_vault/draft/current');
  }
  return fetchAdminDashboard();
}

export async function publishAdminWebsite(): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  const draftRef = vaultDoc(session.vaultKey, 'draft', 'current');
  const pubRef = doc(db, 'portfolio_public', 'live');
  const now = new Date().toISOString();

  try {
    const draftSnap = await getDoc(draftRef);
    const current = draftSnap.data() as {
      profile: ProfileSettings;
      social: SocialSettings;
      content: ContentSettings;
      general: GeneralSettings;
      publishMeta: PublishStatus;
    };
    const nextVersion = (current.publishMeta?.publishedVersion ?? 1) + 1;
    const cleanFields = buildSanitizedSnapshotFields(
      current.profile,
      current.social,
      current.content,
      current.general
    );

    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.set(pubRef, {
      ...cleanFields,
      publishedVersion: nextVersion,
      lastPublishedAt: now,
    });
    batch.set(draftRef, {
      ...cleanFields,
      publishMeta: {
        status: 'published',
        hasUnpublishedChanges: false,
        lastPublishedAt: now,
        publishedVersion: nextVersion,
      } satisfies PublishStatus,
    });
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out publishing website.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portfolio_public/live');
  }

  return fetchAdminDashboard();
}

export async function discardAdminDraft(): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  const draftRef = vaultDoc(session.vaultKey, 'draft', 'current');
  const pubRef = doc(db, 'portfolio_public', 'live');
  try {
    const pubSnap = await getDoc(pubRef);
    const pub = pubSnap.data() as PortfolioData;
    const cleanFields = buildSanitizedSnapshotFields(
      pub.profile || DEFAULT_PROFILE,
      pub.social || DEFAULT_SOCIAL,
      pub.content || DEFAULT_CONTENT,
      pub.general || DEFAULT_GENERAL
    );
    await setDoc(draftRef, {
      ...cleanFields,
      publishMeta: {
        status: 'published',
        hasUnpublishedChanges: false,
        lastPublishedAt: pub.lastPublishedAt ?? null,
        publishedVersion: pub.publishedVersion ?? 1,
      } satisfies PublishStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'admin_vault/draft/current');
  }
  return fetchAdminDashboard();
}

// ---------- Projects CRUD ----------

export async function createAdminProject(
  input: Omit<ProjectItem, 'id' | 'createdAt' | 'sortOrder'>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const existing = await getDocs(vaultCol(session.vaultKey, 'projects'));
  const maxOrder = existing.docs.reduce(
    (max, d) => Math.max(max, Number((d.data() as ProjectItem).sortOrder ?? 0)),
    -1
  );
  const id = createCleanId('proj');
  const project: ProjectItem = {
    id,
    title: String(input.title).trim().slice(0, 160),
    clientName: String(input.clientName || '').trim().slice(0, 160),
    description: String(input.description || '').trim().slice(0, 2000),
    category: (String(input.category || 'Web Development').trim() || 'Web Development').slice(0, 80),
    technologies: (input.technologies || []).slice(0, 20).map((t) => String(t).trim()).filter(Boolean),
    coverImage: String(input.coverImage || '').slice(0, 800000),
    liveUrl: String(input.liveUrl).trim().slice(0, 1000),
    isFeatured: Boolean(input.isFeatured),
    isPublished: Boolean(input.isPublished),
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(vaultDoc(session.vaultKey, 'projects', id), project);
    if (project.isPublished) {
      attachGateProof(batch, session);
      batch.set(doc(db, 'projects', id), project);
    }
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out saving project.');
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${id}`);
  }

  return {project, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminProject(
  id: string,
  input: Partial<ProjectItem>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const refVault = vaultDoc(session.vaultKey, 'projects', id);
  let updated: ProjectItem;
  try {
    const snap = await getDoc(refVault);
    if (!snap.exists()) throw new Error('Project not found.');
    const cur = snap.data() as ProjectItem;
    updated = {
      id: cur.id,
      title: String(input.title ?? cur.title).trim().slice(0, 160),
      clientName: String(input.clientName ?? cur.clientName).trim().slice(0, 160),
      description: String(input.description ?? cur.description).trim().slice(0, 2000),
      category: String(input.category ?? cur.category).trim().slice(0, 80) || 'Web Development',
      technologies: (input.technologies ?? cur.technologies)
        .slice(0, 20)
        .map((t) => String(t).trim())
        .filter(Boolean),
      coverImage: String(input.coverImage ?? cur.coverImage).slice(0, 800000),
      liveUrl: String(input.liveUrl ?? cur.liveUrl).trim().slice(0, 1000),
      isFeatured: Boolean(input.isFeatured ?? cur.isFeatured),
      isPublished: Boolean(input.isPublished ?? cur.isPublished),
      sortOrder: Number(input.sortOrder ?? cur.sortOrder),
      createdAt: cur.createdAt,
    };

    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.set(refVault, updated);
    if (updated.isPublished) {
      batch.set(doc(db, 'projects', id), updated);
    } else {
      batch.delete(doc(db, 'projects', id));
    }
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out updating project.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
  }
  return {project: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminProject(id: string): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.delete(vaultDoc(session.vaultKey, 'projects', id));
    batch.delete(doc(db, 'projects', id));
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out deleting project.');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const snap = await getDocs(vaultCol(session.vaultKey, 'projects'));
    const byId = new Map<string, ProjectItem>();
    snap.docs.forEach((d) => {
      const p = d.data() as ProjectItem;
      byId.set(p.id, p);
    });

    const batch = writeBatch(db);
    attachGateProof(batch, session);
    orderedIds.forEach((id, index) => {
      const item = byId.get(id);
      if (!item) return;
      const next = {...item, sortOrder: index};
      batch.set(vaultDoc(session.vaultKey, 'projects', id), next);
      if (next.isPublished) {
        batch.set(doc(db, 'projects', id), next);
      }
    });
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out reordering projects.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'projects');
  }
  return fetchAdminDashboard();
}

// ---------- Services CRUD ----------

export async function createAdminService(
  input: Omit<ServiceItem, 'id' | 'sortOrder'>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const existing = await getDocs(vaultCol(session.vaultKey, 'services'));
  const maxOrder = existing.docs.reduce(
    (max, d) => Math.max(max, Number((d.data() as ServiceItem).sortOrder ?? 0)),
    -1
  );
  const id = createCleanId('svc');
  const service: ServiceItem = {
    id,
    title: String(input.title).trim().slice(0, 120),
    description: String(input.description || '').trim().slice(0, 1000),
    icon: String(input.icon || 'Code2').slice(0, 60),
    sortOrder: maxOrder + 1,
    isActive: Boolean(input.isActive),
  };
  try {
    const batch = writeBatch(db);
    batch.set(vaultDoc(session.vaultKey, 'services', id), service);
    if (service.isActive) {
      attachGateProof(batch, session);
      batch.set(doc(db, 'services', id), service);
    }
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out creating service.');
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `services/${id}`);
  }
  return {service, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminService(
  id: string,
  input: Partial<ServiceItem>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const refVault = vaultDoc(session.vaultKey, 'services', id);
  let updated: ServiceItem;
  try {
    const snap = await getDoc(refVault);
    if (!snap.exists()) throw new Error('Service not found.');
    const cur = snap.data() as ServiceItem;
    updated = {
      id: cur.id,
      title: String(input.title ?? cur.title).trim().slice(0, 120),
      description: String(input.description ?? cur.description).trim().slice(0, 1000),
      icon: String(input.icon ?? cur.icon).slice(0, 60) || 'Code2',
      sortOrder: Number(input.sortOrder ?? cur.sortOrder),
      isActive: Boolean(input.isActive ?? cur.isActive),
    };
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.set(refVault, updated);
    if (updated.isActive) {
      batch.set(doc(db, 'services', id), updated);
    } else {
      batch.delete(doc(db, 'services', id));
    }
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out updating service.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
  }
  return {service: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminService(id: string): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.delete(vaultDoc(session.vaultKey, 'services', id));
    batch.delete(doc(db, 'services', id));
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out deleting service.');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminServices(orderedIds: string[]): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const snap = await getDocs(vaultCol(session.vaultKey, 'services'));
    const byId = new Map<string, ServiceItem>();
    snap.docs.forEach((d) => {
      const s = d.data() as ServiceItem;
      byId.set(s.id, s);
    });

    const batch = writeBatch(db);
    attachGateProof(batch, session);
    orderedIds.forEach((id, index) => {
      const item = byId.get(id);
      if (!item) return;
      const next = {...item, sortOrder: index};
      batch.set(vaultDoc(session.vaultKey, 'services', id), next);
      if (next.isActive) {
        batch.set(doc(db, 'services', id), next);
      }
    });
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out reordering services.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'services');
  }
  return fetchAdminDashboard();
}

// ---------- Skills CRUD ----------

export async function createAdminSkill(
  input: Omit<SkillItem, 'id' | 'sortOrder'>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const existing = await getDocs(vaultCol(session.vaultKey, 'skills'));
  const maxOrder = existing.docs.reduce(
    (max, d) => Math.max(max, Number((d.data() as SkillItem).sortOrder ?? 0)),
    -1
  );
  const id = createCleanId('sk');
  const skill: SkillItem = {
    id,
    name: String(input.name).trim().slice(0, 100),
    category: (String(input.category || 'Engineering').trim() || 'Engineering').slice(0, 80),
    proficiency: Math.min(100, Math.max(0, Number(input.proficiency ?? 90))),
    sortOrder: maxOrder + 1,
  };
  try {
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.set(vaultDoc(session.vaultKey, 'skills', id), skill);
    batch.set(doc(db, 'skills', id), skill);
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out adding skill.');
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `skills/${id}`);
  }
  return {skill, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminSkill(
  id: string,
  input: Partial<SkillItem>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const refVault = vaultDoc(session.vaultKey, 'skills', id);
  let updated: SkillItem;
  try {
    const snap = await getDoc(refVault);
    if (!snap.exists()) throw new Error('Skill not found.');
    const cur = snap.data() as SkillItem;
    updated = {
      id: cur.id,
      name: String(input.name ?? cur.name).trim().slice(0, 100),
      category: String(input.category ?? cur.category).trim().slice(0, 80) || 'Engineering',
      proficiency: Math.min(100, Math.max(0, Number(input.proficiency ?? cur.proficiency))),
      sortOrder: Number(input.sortOrder ?? cur.sortOrder),
    };
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.set(refVault, updated);
    batch.set(doc(db, 'skills', id), updated);
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out updating skill.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `skills/${id}`);
  }
  return {skill: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminSkill(id: string): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const batch = writeBatch(db);
    attachGateProof(batch, session);
    batch.delete(vaultDoc(session.vaultKey, 'skills', id));
    batch.delete(doc(db, 'skills', id));
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out deleting skill.');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `skills/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminSkills(orderedIds: string[]): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  try {
    const snap = await getDocs(vaultCol(session.vaultKey, 'skills'));
    const byId = new Map<string, SkillItem>();
    snap.docs.forEach((d) => {
      const s = d.data() as SkillItem;
      byId.set(s.id, s);
    });

    const batch = writeBatch(db);
    attachGateProof(batch, session);
    orderedIds.forEach((id, index) => {
      const item = byId.get(id);
      if (!item) return;
      const next = {...item, sortOrder: index};
      batch.set(vaultDoc(session.vaultKey, 'skills', id), next);
      batch.set(doc(db, 'skills', id), next);
    });
    await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out reordering skills.');
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'skills');
  }
  return fetchAdminDashboard();
}

// ---------- Persistent Cloud Image Upload (Validation, Compression, Progress, Timeout Guard) ----------

export function validateImageFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedMimes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  const allowedExts = new Set(['jpg', 'jpeg', 'png', 'webp']);

  const mimeOk = file.type ? allowedMimes.has(file.type.toLowerCase()) : allowedExts.has(ext);
  if (!mimeOk && !allowedExts.has(ext)) {
    return 'Unsupported image type. Please select a JPG, PNG, or WebP file.';
  }
  if (file.size === 0) {
    return 'The selected image file is empty.';
  }
  if (file.size > MAX_UPLOAD_INPUT_BYTES) {
    return 'Image exceeds the 10 MB maximum file size limit.';
  }
  return null;
}

function loadImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timer = window.setTimeout(() => {
      reject(new Error('Image decoding timed out. Please try a different image file.'));
    }, 15000);

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        window.clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Unable to decode selected image. Please ensure it is a valid JPG, PNG, or WebP file.'));
      };
      img.src = String(reader.result || '');
    };
    reader.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Failed to read selected file from device.'));
    };
    reader.readAsDataURL(file);
  });
}

async function optimizeImageForCloudFirestore(
  file: File,
  sectionTag: MediaItem['sectionTag']
): Promise<{url: string; mimeType: string; sizeBytes: number}> {
  const img = await loadImageElementFromFile(file);

  // Profile, About, Hero share portfolio_public/live document budget (max ~240KB each).
  // Project & General assets sit in dedicated documents (max ~420KB each).
  const targetMaxLength =
    sectionTag === 'profile' || sectionTag === 'about' || sectionTag === 'hero'
      ? 240000
      : 420000;

  let maxDim = sectionTag === 'project' ? 1400 : 1200;
  let dataUrl = '';

  for (let pass = 0; pass < 4; pass++) {
    let {width, height} = img;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas unavailable for image optimization.');
    }
    ctx.drawImage(img, 0, 0, width, height);

    const preferPng =
      file.type === 'image/png' && file.size < 180000;
    const formats = preferPng ? ['image/png', 'image/webp', 'image/jpeg'] : ['image/webp', 'image/jpeg'];

    let matched = false;
    for (const fmt of formats) {
      for (const quality of [0.85, 0.72, 0.58, 0.44]) {
        const candidate = fmt === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL(fmt, quality);
        if (candidate.startsWith(`data:${fmt}`) && candidate.length <= targetMaxLength) {
          dataUrl = candidate;
          matched = true;
          break;
        }
        if (fmt === 'image/png') break;
      }
      if (matched) break;
    }

    if (matched) break;
    maxDim = Math.round(maxDim * 0.72);
  }

  if (!dataUrl || dataUrl.length > 780000) {
    throw new Error('Image remains too large after optimization. Please choose a smaller image.');
  }

  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const mimeType = mimeMatch?.[1] || 'image/webp';
  return {url: dataUrl, mimeType, sizeBytes: dataUrl.length};
}

export async function uploadMediaFile(
  file: File,
  sectionTag: MediaItem['sectionTag'] = 'general',
  onProgress?: UploadProgressCallback
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  onProgress?.(10, 'Validating image...');

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(35, 'Optimizing image for cloud delivery...');
  const stored = await optimizeImageForCloudFirestore(file, sectionTag);

  const id = createCleanId('media');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.webp';
  const media: MediaItem = {
    id,
    filename: `${id}-${safeName}`.slice(0, 260),
    originalName: file.name.slice(0, 260),
    url: stored.url,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    sectionTag,
    isBuiltin: false,
    createdAt: new Date().toISOString(),
  };

  onProgress?.(75, 'Saving image to Cloud Firestore...');
  try {
    await withTimeout(
      setDoc(vaultDoc(session.vaultKey, 'media', id), media),
      REQUEST_TIMEOUT_MS,
      'Upload timed out while saving to cloud database. Please retry.'
    );
  } catch (error) {
    if (isPermissionDenied(error)) {
      clearAdminSession();
      throw new Error('Unauthorized session. Please log in again.');
    }
    handleFirestoreError(error, OperationType.CREATE, `admin_vault/media/${id}`);
  }

  onProgress?.(92, 'Syncing media library...');
  const dashboard = await fetchAdminDashboard();
  onProgress?.(100, 'Upload complete');
  return {media, dashboard};
}

export async function replaceMediaFile(
  id: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  onProgress?.(10, 'Validating replacement image...');

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const mediaRef = vaultDoc(session.vaultKey, 'media', id);
  const existingSnap = await withTimeout(
    getDoc(mediaRef),
    REQUEST_TIMEOUT_MS,
    'Timed out loading existing media asset.'
  );
  if (!existingSnap.exists()) {
    throw new Error('Media asset not found.');
  }
  const existing = existingSnap.data() as MediaItem;
  const oldUrl = existing.url;

  onProgress?.(35, 'Optimizing replacement image...');
  const stored = await optimizeImageForCloudFirestore(file, existing.sectionTag);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.webp';
  const nextMedia: MediaItem = {
    ...existing,
    filename: `${id}-${Date.now()}-${safeName}`.slice(0, 260),
    originalName: file.name.slice(0, 260),
    url: stored.url,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    isBuiltin: false,
  };

  onProgress?.(75, 'Saving replacement across portfolio...');
  try {
    await withTimeout(setDoc(mediaRef, nextMedia), REQUEST_TIMEOUT_MS, 'Timed out saving replacement image.');

    const draftSnap = await getDoc(vaultDoc(session.vaultKey, 'draft', 'current'));
    if (draftSnap.exists()) {
      const draft = draftSnap.data() as {profile: ProfileSettings};
      const nextProfile = {...draft.profile};
      let changed = false;
      if (nextProfile.profileImage === oldUrl) {
        nextProfile.profileImage = nextMedia.url;
        changed = true;
      }
      if (nextProfile.aboutImage === oldUrl) {
        nextProfile.aboutImage = nextMedia.url;
        changed = true;
      }
      if (nextProfile.heroBgImage === oldUrl) {
        nextProfile.heroBgImage = nextMedia.url;
        changed = true;
      }
      if (changed) {
        await markDraftModified(session, {profile: nextProfile});
      }
    }

    const projs = await getDocs(vaultCol(session.vaultKey, 'projects'));
    const batch = writeBatch(db);
    let projChanged = false;
    for (const pDoc of projs.docs) {
      const p = pDoc.data() as ProjectItem;
      if (p.coverImage === oldUrl) {
        const nextProj = {...p, coverImage: nextMedia.url};
        batch.set(vaultDoc(session.vaultKey, 'projects', p.id), nextProj);
        if (nextProj.isPublished) {
          batch.set(doc(db, 'projects', p.id), nextProj);
          projChanged = true;
        }
      }
    }
    if (projChanged) {
      attachGateProof(batch, session);
    }
    if (projs.docs.some((d) => (d.data() as ProjectItem).coverImage === oldUrl)) {
      await withTimeout(batch.commit(), REQUEST_TIMEOUT_MS, 'Timed out updating linked projects.');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `admin_vault/media/${id}`);
  }

  onProgress?.(100, 'Replacement complete');
  return {media: nextMedia, dashboard: await fetchAdminDashboard()};
}

export async function updateMediaTag(
  id: string,
  sectionTag: MediaItem['sectionTag']
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const session = requireActiveSession();
  const mediaRef = vaultDoc(session.vaultKey, 'media', id);
  try {
    const snap = await getDoc(mediaRef);
    if (!snap.exists()) throw new Error('Media asset not found.');
    const next = {...(snap.data() as MediaItem), sectionTag};
    await setDoc(mediaRef, next);
    return {media: next, dashboard: await fetchAdminDashboard()};
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `admin_vault/media/${id}`);
  }
}

export async function deleteMediaFile(id: string): Promise<AdminDashboardData> {
  const session = requireActiveSession();
  const mediaRef = vaultDoc(session.vaultKey, 'media', id);
  try {
    const snap = await getDoc(mediaRef);
    if (!snap.exists()) throw new Error('Media asset not found.');
    const existing = snap.data() as MediaItem;

    await deleteDoc(mediaRef);

    const draftSnap = await getDoc(vaultDoc(session.vaultKey, 'draft', 'current'));
    if (draftSnap.exists()) {
      const draft = draftSnap.data() as {profile: ProfileSettings};
      const nextProfile = {...draft.profile};
      let changed = false;
      if (nextProfile.profileImage === existing.url) {
        nextProfile.profileImage = '';
        changed = true;
      }
      if (nextProfile.aboutImage === existing.url) {
        nextProfile.aboutImage = '';
        changed = true;
      }
      if (nextProfile.heroBgImage === existing.url) {
        nextProfile.heroBgImage = '';
        changed = true;
      }
      if (changed) {
        await markDraftModified(session, {profile: nextProfile});
      }
    }

    const projs = await getDocs(vaultCol(session.vaultKey, 'projects'));
    const batch = writeBatch(db);
    let anyProj = false;
    let anyPublished = false;
    for (const pDoc of projs.docs) {
      const p = pDoc.data() as ProjectItem;
      if (p.coverImage === existing.url) {
        const cleared = {...p, coverImage: ''};
        batch.set(vaultDoc(session.vaultKey, 'projects', p.id), cleared);
        anyProj = true;
        if (cleared.isPublished) {
          batch.set(doc(db, 'projects', p.id), cleared);
          anyPublished = true;
        }
      }
    }
    if (anyPublished) {
      attachGateProof(batch, session);
    }
    if (anyProj) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admin_vault/media/${id}`);
  }
  return fetchAdminDashboard();
}
