import {onAuthStateChanged, signInWithPopup, signOut, type User} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {deleteObject, getDownloadURL, ref, uploadBytes} from 'firebase/storage';
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
import {auth, db, googleProvider, handleFirestoreError, OperationType, storage} from './firebase.ts';

export const ADMIN_EMAIL = 'robynight2001@gmail.com';

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

// ---------- Public Portfolio Read + Real-Time Subscription ----------

export async function fetchPublicPortfolio(): Promise<PortfolioData> {
  let publicDocData: Partial<PortfolioData> | null = null;
  try {
    const snap = await getDoc(doc(db, 'portfolio_public', 'live'));
    if (snap.exists()) {
      publicDocData = snap.data() as Partial<PortfolioData>;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portfolio_public/live');
  }

  let projects: ProjectItem[] = [];
  try {
    const q = query(collection(db, 'projects'), where('isPublished', '==', true));
    const snap = await getDocs(q);
    projects = sortProjects(snap.docs.map((d) => d.data() as ProjectItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  }

  let services: ServiceItem[] = [];
  try {
    const q = query(collection(db, 'services'), where('isActive', '==', true));
    const snap = await getDocs(q);
    services = sortByOrder(snap.docs.map((d) => d.data() as ServiceItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
  }

  let skills: SkillItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'skills'));
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

// ---------- Firebase Authentication (Admin Only) ----------

export function isAuthorizedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified) && user.email === ADMIN_EMAIL;
}

export function subscribeAuthState(
  callback: (state: {ready: boolean; authenticated: boolean; user: User | null}) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ready: true, authenticated: false, user: null});
      return;
    }
    const allowed = user.emailVerified && user.email === ADMIN_EMAIL;
    if (allowed) {
      callback({ready: true, authenticated: true, user});
      return;
    }
    // Check admins registry document as secondary admin check
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (adminSnap.exists() && user.emailVerified) {
        callback({ready: true, authenticated: true, user});
        return;
      }
    } catch {
      // deny if lookup fails
    }
    callback({ready: true, authenticated: false, user});
  });
}

export async function loginAdminWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error('Your Google account email must be verified.');
  }
  if (user.email !== ADMIN_EMAIL) {
    // Check admins collection
    let isListedAdmin = false;
    try {
      const snap = await getDoc(doc(db, 'admins', user.uid));
      isListedAdmin = snap.exists();
    } catch {
      isListedAdmin = false;
    }
    if (!isListedAdmin) {
      await signOut(auth);
      throw new Error(
        `Access denied for ${user.email || 'this account'}. Only the portfolio administrator (${ADMIN_EMAIL}) can access Settings.`
      );
    }
  }
  return user;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

// ---------- Admin Initial Seeding & Dashboard Fetch ----------

async function ensureFirestoreInitialized(): Promise<void> {
  const now = new Date().toISOString();
  const baseFields = buildSanitizedSnapshotFields(
    DEFAULT_PROFILE,
    DEFAULT_SOCIAL,
    DEFAULT_CONTENT,
    DEFAULT_GENERAL
  );

  // Ensure portfolio_public/live exists
  const pubRef = doc(db, 'portfolio_public', 'live');
  let pubExists = false;
  try {
    const pubSnap = await getDoc(pubRef);
    pubExists = pubSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portfolio_public/live');
  }

  if (!pubExists) {
    try {
      await setDoc(pubRef, {
        ...baseFields,
        publishedVersion: 1,
        lastPublishedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'portfolio_public/live');
    }
  }

  // Ensure portfolio_draft/current exists
  const draftRef = doc(db, 'portfolio_draft', 'current');
  let draftExists = false;
  try {
    const draftSnap = await getDoc(draftRef);
    draftExists = draftSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portfolio_draft/current');
  }

  if (!draftExists) {
    try {
      await setDoc(draftRef, {
        ...baseFields,
        publishMeta: {
          status: 'published',
          hasUnpublishedChanges: false,
          lastPublishedAt: now,
          publishedVersion: 1,
        } satisfies PublishStatus,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'portfolio_draft/current');
    }

    // Seed initial services, skills, and builtin media on first admin initialization
    const batch = writeBatch(db);
    const existingServices = await getDocs(collection(db, 'services'));
    if (existingServices.empty) {
      for (const svc of INITIAL_SERVICES) {
        batch.set(doc(db, 'services', svc.id), svc);
      }
    }
    const existingSkills = await getDocs(collection(db, 'skills'));
    if (existingSkills.empty) {
      for (const sk of INITIAL_SKILLS) {
        batch.set(doc(db, 'skills', sk.id), sk);
      }
    }
    const existingMedia = await getDocs(collection(db, 'media'));
    if (existingMedia.empty) {
      for (const m of INITIAL_MEDIA) {
        batch.set(doc(db, 'media', m.id), m);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'initial-seed');
    }
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  await ensureFirestoreInitialized();

  let draftData: {
    profile: ProfileSettings;
    social: SocialSettings;
    content: ContentSettings;
    general: GeneralSettings;
    publishMeta: PublishStatus;
  };
  try {
    const draftSnap = await getDoc(doc(db, 'portfolio_draft', 'current'));
    draftData = draftSnap.data() as typeof draftData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portfolio_draft/current');
  }

  let allProjects: ProjectItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'projects'));
    allProjects = sortAdminProjects(snap.docs.map((d) => d.data() as ProjectItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  }

  let allServices: ServiceItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'services'));
    allServices = sortByOrder(snap.docs.map((d) => d.data() as ServiceItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
  }

  let skills: SkillItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'skills'));
    skills = sortByOrder(snap.docs.map((d) => d.data() as SkillItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'skills');
  }

  let media: MediaItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'media'));
    media = snap.docs
      .map((d) => d.data() as MediaItem)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'media');
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
  overrides?: Partial<{
    profile: ProfileSettings;
    social: SocialSettings;
    content: ContentSettings;
    general: GeneralSettings;
  }>
): Promise<void> {
  const draftRef = doc(db, 'portfolio_draft', 'current');
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
  await setDoc(draftRef, {
    ...nextFields,
    publishMeta: {
      status: 'draft',
      hasUnpublishedChanges: true,
      lastPublishedAt: current.publishMeta?.lastPublishedAt ?? null,
      publishedVersion: current.publishMeta?.publishedVersion ?? 1,
    } satisfies PublishStatus,
  });
}

// ---------- Settings Save / Publish / Discard ----------

export async function saveSettingsSection<T>(
  section: 'profile' | 'social' | 'content' | 'general',
  data: T
): Promise<AdminDashboardData> {
  try {
    await markDraftModified({[section]: data});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'portfolio_draft/current');
  }
  return fetchAdminDashboard();
}

export async function publishAdminWebsite(): Promise<AdminDashboardData> {
  const draftRef = doc(db, 'portfolio_draft', 'current');
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
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portfolio_public/live');
  }

  return fetchAdminDashboard();
}

export async function discardAdminDraft(): Promise<AdminDashboardData> {
  const draftRef = doc(db, 'portfolio_draft', 'current');
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
    handleFirestoreError(error, OperationType.UPDATE, 'portfolio_draft/current');
  }
  return fetchAdminDashboard();
}

// ---------- Projects CRUD ----------

export async function createAdminProject(
  input: Omit<ProjectItem, 'id' | 'createdAt' | 'sortOrder'>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  const existing = await getDocs(collection(db, 'projects'));
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
    await setDoc(doc(db, 'projects', id), project);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${id}`);
  }

  return {project, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminProject(
  id: string,
  input: Partial<ProjectItem>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  const refDoc = doc(db, 'projects', id);
  let updated: ProjectItem;
  try {
    const snap = await getDoc(refDoc);
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
    await setDoc(refDoc, updated);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
  }
  return {project: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminProject(id: string): Promise<AdminDashboardData> {
  try {
    await deleteDoc(doc(db, 'projects', id));
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<AdminDashboardData> {
  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'projects', id), {sortOrder: index});
    });
    await batch.commit();
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'projects');
  }
  return fetchAdminDashboard();
}

// ---------- Services CRUD ----------

export async function createAdminService(
  input: Omit<ServiceItem, 'id' | 'sortOrder'>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  const existing = await getDocs(collection(db, 'services'));
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
    await setDoc(doc(db, 'services', id), service);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `services/${id}`);
  }
  return {service, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminService(
  id: string,
  input: Partial<ServiceItem>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  const refDoc = doc(db, 'services', id);
  let updated: ServiceItem;
  try {
    const snap = await getDoc(refDoc);
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
    await setDoc(refDoc, updated);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
  }
  return {service: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminService(id: string): Promise<AdminDashboardData> {
  try {
    await deleteDoc(doc(db, 'services', id));
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminServices(orderedIds: string[]): Promise<AdminDashboardData> {
  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'services', id), {sortOrder: index});
    });
    await batch.commit();
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'services');
  }
  return fetchAdminDashboard();
}

// ---------- Skills CRUD ----------

export async function createAdminSkill(
  input: Omit<SkillItem, 'id' | 'sortOrder'>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  const existing = await getDocs(collection(db, 'skills'));
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
    await setDoc(doc(db, 'skills', id), skill);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `skills/${id}`);
  }
  return {skill, dashboard: await fetchAdminDashboard()};
}

export async function updateAdminSkill(
  id: string,
  input: Partial<SkillItem>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  const refDoc = doc(db, 'skills', id);
  let updated: SkillItem;
  try {
    const snap = await getDoc(refDoc);
    if (!snap.exists()) throw new Error('Skill not found.');
    const cur = snap.data() as SkillItem;
    updated = {
      id: cur.id,
      name: String(input.name ?? cur.name).trim().slice(0, 100),
      category: String(input.category ?? cur.category).trim().slice(0, 80) || 'Engineering',
      proficiency: Math.min(100, Math.max(0, Number(input.proficiency ?? cur.proficiency))),
      sortOrder: Number(input.sortOrder ?? cur.sortOrder),
    };
    await setDoc(refDoc, updated);
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `skills/${id}`);
  }
  return {skill: updated, dashboard: await fetchAdminDashboard()};
}

export async function deleteAdminSkill(id: string): Promise<AdminDashboardData> {
  try {
    await deleteDoc(doc(db, 'skills', id));
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `skills/${id}`);
  }
  return fetchAdminDashboard();
}

export async function reorderAdminSkills(orderedIds: string[]): Promise<AdminDashboardData> {
  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'skills', id), {sortOrder: index});
    });
    await batch.commit();
    await markDraftModified();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'skills');
  }
  return fetchAdminDashboard();
}

// ---------- Persistent Image Upload (Firebase Storage + Optimized Firestore Fallback) ----------

async function compressImageToDataUrl(file: File): Promise<{url: string; mimeType: string; sizeBytes: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1400;
      let {width, height} = img;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to process image canvas.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.84;
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      while (dataUrl.length > 650000 && quality > 0.35) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      if (dataUrl.length > 780000) {
        reject(new Error('Image is too large even after compression. Please choose a smaller image.'));
        return;
      }
      const mimeType = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      resolve({url: dataUrl, mimeType, sizeBytes: dataUrl.length});
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read selected image file.'));
    };
    img.src = objectUrl;
  });
}

async function storeImagePersistently(
  file: File,
  storagePath: string
): Promise<{url: string; mimeType: string; sizeBytes: number; storageKey: string}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }
  // Try Firebase Storage first with a clean timeout fallback
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {contentType: file.type});
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      url: downloadUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: storagePath,
    };
  } catch {
    // Fallback: compress cleanly into Firestore-safe persistent image URL (< 780KB)
    const compressed = await compressImageToDataUrl(file);
    return {
      url: compressed.url,
      mimeType: compressed.mimeType,
      sizeBytes: compressed.sizeBytes,
      storageKey: storagePath,
    };
  }
}

export async function uploadMediaFile(
  file: File,
  sectionTag: MediaItem['sectionTag'] = 'general'
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const id = createCleanId('media');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.jpg';
  const storagePath = `portfolio-media/${id}-${safeName}`;
  const stored = await storeImagePersistently(file, storagePath);

  const media: MediaItem = {
    id,
    filename: stored.storageKey.slice(0, 260),
    originalName: file.name.slice(0, 260),
    url: stored.url,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    sectionTag,
    isBuiltin: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'media', id), media);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `media/${id}`);
  }

  return {media, dashboard: await fetchAdminDashboard()};
}

export async function replaceMediaFile(
  id: string,
  file: File
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const mediaRef = doc(db, 'media', id);
  const existingSnap = await getDoc(mediaRef);
  if (!existingSnap.exists()) {
    throw new Error('Media asset not found.');
  }
  const existing = existingSnap.data() as MediaItem;
  const oldUrl = existing.url;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.jpg';
  const storagePath = `portfolio-media/${id}-${Date.now()}-${safeName}`;
  const stored = await storeImagePersistently(file, storagePath);

  const nextMedia: MediaItem = {
    ...existing,
    filename: stored.storageKey.slice(0, 260),
    originalName: file.name.slice(0, 260),
    url: stored.url,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    isBuiltin: false,
  };

  try {
    await setDoc(mediaRef, nextMedia);

    // Propagate replacement URL to draft profile and projects referencing the old URL
    const draftSnap = await getDoc(doc(db, 'portfolio_draft', 'current'));
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
        await markDraftModified({profile: nextProfile});
      }
    }

    const projs = await getDocs(collection(db, 'projects'));
    for (const pDoc of projs.docs) {
      const p = pDoc.data() as ProjectItem;
      if (p.coverImage === oldUrl) {
        await updateDoc(doc(db, 'projects', p.id), {coverImage: nextMedia.url});
        await markDraftModified();
      }
    }

    // Attempt cleanup of previous Storage object if it was in Firebase Storage
    if (!existing.isBuiltin && existing.filename.startsWith('portfolio-media/') && oldUrl.startsWith('https://')) {
      deleteObject(ref(storage, existing.filename)).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `media/${id}`);
  }

  return {media: nextMedia, dashboard: await fetchAdminDashboard()};
}

export async function updateMediaTag(
  id: string,
  sectionTag: MediaItem['sectionTag']
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const mediaRef = doc(db, 'media', id);
  try {
    await updateDoc(mediaRef, {sectionTag});
    const snap = await getDoc(mediaRef);
    return {media: snap.data() as MediaItem, dashboard: await fetchAdminDashboard()};
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `media/${id}`);
  }
}

export async function deleteMediaFile(id: string): Promise<AdminDashboardData> {
  const mediaRef = doc(db, 'media', id);
  try {
    const snap = await getDoc(mediaRef);
    if (!snap.exists()) throw new Error('Media asset not found.');
    const existing = snap.data() as MediaItem;

    await deleteDoc(mediaRef);

    // Clear references from draft profile and projects
    const draftSnap = await getDoc(doc(db, 'portfolio_draft', 'current'));
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
        await markDraftModified({profile: nextProfile});
      }
    }

    const projs = await getDocs(collection(db, 'projects'));
    for (const pDoc of projs.docs) {
      const p = pDoc.data() as ProjectItem;
      if (p.coverImage === existing.url) {
        await updateDoc(doc(db, 'projects', p.id), {coverImage: ''});
        await markDraftModified();
      }
    }

    if (!existing.isBuiltin && existing.filename.startsWith('portfolio-media/') && existing.url.startsWith('https://')) {
      deleteObject(ref(storage, existing.filename)).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `media/${id}`);
  }
  return fetchAdminDashboard();
}
