export interface ProfileSettings {
  name: string;
  title: string;
  heroHeadline: string;
  heroDescription: string;
  aboutHeading: string;
  aboutText: string;
  aboutHighlights: string[];
  availabilityStatus: string;
  availabilityActive: boolean;
  profileImage: string;
  aboutImage: string;
  heroBgImage: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface SocialSettings {
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  whatsappLink: string;
  email: string;
}

export interface NavLabels {
  home: string;
  about: string;
  services: string;
  projects: string;
  contact: string;
}

export interface ContentSettings {
  navLabels: NavLabels;
  servicesTitle: string;
  servicesSubtitle: string;
  skillsTitle: string;
  projectsTitle: string;
  projectsSubtitle: string;
  contactHeadline: string;
  contactDescription: string;
  footerBio: string;
  footerCopyrightName: string;
  showLoadingScreen: boolean;
}

export interface GeneralSettings {
  siteTitle: string;
  siteDescription: string;
  enable3DBackground: boolean;
  enableCustomCursor: boolean;
  enableFloatingWhatsApp: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  sortOrder: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  clientName: string;
  description: string;
  category: string;
  technologies: string[];
  coverImage: string;
  liveUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sectionTag: 'profile' | 'hero' | 'about' | 'project' | 'general';
  isBuiltin: boolean;
  createdAt: string;
}

export interface PublishStatus {
  status: 'published' | 'draft';
  hasUnpublishedChanges: boolean;
  lastPublishedAt: string | null;
  publishedVersion: number;
}

export interface PortfolioData {
  profile: ProfileSettings;
  social: SocialSettings;
  content: ContentSettings;
  general: GeneralSettings;
  services: ServiceItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  publishedVersion?: number;
  lastPublishedAt?: string | null;
}

export interface AdminDashboardData extends PortfolioData {
  allProjects: ProjectItem[];
  allServices: ServiceItem[];
  media: MediaItem[];
  publishStatus: PublishStatus;
  stats: {
    totalProjects: number;
    publishedProjects: number;
    featuredProjects: number;
    totalServices: number;
    activeServices: number;
    totalSkills: number;
    totalMedia: number;
  };
}
