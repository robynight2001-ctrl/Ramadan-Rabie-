import type {
  ContentSettings,
  GeneralSettings,
  MediaItem,
  ProfileSettings,
  ServiceItem,
  SkillItem,
  SocialSettings,
} from '../types/portfolio.ts';

export const DEFAULT_PROFILE: ProfileSettings = {
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

export const DEFAULT_SOCIAL: SocialSettings = {
  instagramUrl: 'https://www.instagram.com/ramadan.rabie_?knvt=MTJhdTVyMXllemZyMg==',
  facebookUrl: 'https://www.facebook.com/share/1FeiNoTDve/',
  whatsappNumber: '+20 10 44186025',
  whatsappLink: 'https://wa.me/201044186025',
  email: '',
};

export const DEFAULT_CONTENT: ContentSettings = {
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

export const DEFAULT_GENERAL: GeneralSettings = {
  siteTitle: 'Ramadan Rabie — Software Engineer & Web Developer',
  siteDescription:
    'I design and develop modern, high-performance websites that help businesses build a strong digital presence, stand out, and turn visitors into customers.',
  enable3DBackground: true,
  enableCustomCursor: true,
  enableFloatingWhatsApp: true,
};

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'svc-web-dev',
    title: 'Web Development',
    description:
      'End-to-end engineering of resilient, scalable websites built with clean architecture and modern standards.',
    icon: 'Code2',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'svc-frontend',
    title: 'Frontend Development',
    description:
      'Fluid, motion-driven user interfaces crafted in React and TypeScript with razor-sharp visual fidelity.',
    icon: 'Layers',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'svc-backend',
    title: 'Backend Development',
    description:
      'Secure APIs, database modeling, authentication flows, and server architecture designed for reliability.',
    icon: 'Server',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'svc-responsive',
    title: 'Responsive Web Design',
    description:
      'Adaptive layouts engineered to feel natural and effortless across desktop monitors, tablets, and mobile screens.',
    icon: 'Smartphone',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'svc-uiux',
    title: 'UI/UX Implementation',
    description:
      'Translating product vision and creative direction into intuitive user journeys, micro-interactions, and clear hierarchy.',
    icon: 'PenTool',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'svc-optimization',
    title: 'Website Optimization',
    description:
      'Core Web Vitals tuning, bundle slimming, asset delivery, and SEO foundations for instant perceived speed.',
    icon: 'Gauge',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'svc-webapps',
    title: 'Modern Web Applications',
    description:
      'Interactive full-stack dashboards, portals, and bespoke SaaS products tailored to real business workflows.',
    icon: 'Cpu',
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'svc-business',
    title: 'Business Websites',
    description:
      'High-converting brand flagships and landing experiences built to elevate authority and turn visitors into clients.',
    icon: 'Globe',
    sortOrder: 7,
    isActive: true,
  },
];

export const INITIAL_SKILLS: SkillItem[] = [
  {id: 'sk-typescript', name: 'TypeScript', category: 'Language', proficiency: 95, sortOrder: 0},
  {id: 'sk-react', name: 'React & Next.js', category: 'Frontend', proficiency: 96, sortOrder: 1},
  {id: 'sk-tailwind', name: 'Tailwind CSS', category: 'Styling', proficiency: 98, sortOrder: 2},
  {id: 'sk-node', name: 'Node.js & Express', category: 'Backend', proficiency: 92, sortOrder: 3},
  {id: 'sk-sql', name: 'PostgreSQL & SQL', category: 'Database', proficiency: 90, sortOrder: 4},
  {id: 'sk-motion', name: 'Motion & GSAP', category: 'Animation', proficiency: 92, sortOrder: 5},
  {id: 'sk-three', name: 'Three.js / WebGL', category: '3D & Canvas', proficiency: 86, sortOrder: 6},
  {id: 'sk-perf', name: 'Performance & SEO', category: 'Optimization', proficiency: 94, sortOrder: 7},
];

export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'builtin-profile-portrait',
    filename: 'ramadan_profile_portrait_1795110499404.jpg',
    originalName: 'Ramadan Studio Portrait.jpg',
    url: '/src/assets/images/ramadan_profile_portrait_1795110499404.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 142000,
    sectionTag: 'profile',
    isBuiltin: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-about-workspace',
    filename: 'about_studio_workspace_1795110499446.jpg',
    originalName: 'Studio Architecture Desk.jpg',
    url: '/src/assets/images/about_studio_workspace_1795110499446.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 168000,
    sectionTag: 'about',
    isBuiltin: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
