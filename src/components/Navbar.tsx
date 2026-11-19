import {AnimatePresence, motion} from 'motion/react';
import {Menu, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {NavLabels} from '../types/portfolio.ts';

interface NavbarProps {
  brandName: string;
  navLabels: NavLabels;
  ctaLabel: string;
  ctaHref: string;
}

export function Navbar({brandName, navLabels, ctaLabel, ctaHref}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {id: 'home', label: navLabels.home || 'Home', href: '#home'},
    {id: 'about', label: navLabels.about || 'About', href: '#about'},
    {id: 'services', label: navLabels.services || 'Services', href: '#services'},
    {id: 'projects', label: navLabels.projects || 'Projects', href: '#projects'},
    {id: 'contact', label: navLabels.contact || 'Contact', href: '#contact'},
  ];

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ['home', 'about', 'services', 'projects', 'contact'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {rootMargin: '-38% 0px -48% 0px', threshold: 0.01}
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id?: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.getElementById(href.slice(1));
      if (target) {
        target.scrollIntoView({behavior: 'smooth'});
      }
      if (id) setActiveSection(id);
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08090D]/80 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 lg:px-10">
        {/* Zone 1: Brand wordmark (single text element) */}
        <a
          href="#home"
          onClick={(e) => handleLinkClick(e, '#home', 'home')}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F7] whitespace-nowrap shrink-0 transition-colors hover:text-white"
        >
          {brandName}
        </a>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href, item.id)}
                className={`group relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-[#F5F5F7]' : 'text-[#9CA3AF] hover:text-[#F5F5F7]'
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 h-[1.5px] w-full origin-left bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA action (and mobile menu toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={ctaHref || '#contact'}
            onClick={(e) => handleLinkClick(e, ctaHref || '#contact', 'contact')}
            className="hidden md:inline-flex items-center justify-center rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-sm font-medium text-[#F5F5F7] whitespace-nowrap shrink-0 transition-all duration-200 hover:border-[#A855F7] hover:bg-[#8B5CF6]/20 hover:shadow-[0_0_24px_rgba(139,92,246,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            {ctaLabel || "Let's Talk"}
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#11131B]/80 text-[#F5F5F7] md:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Animated mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{opacity: 0, y: -12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
            className="border-b border-white/10 bg-[#08090D]/95 backdrop-blur-2xl px-6 pb-6 pt-4 md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href, item.id)}
                    className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-[#8B5CF6]/15 text-[#F5F5F7]'
                        : 'text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />}
                  </a>
                );
              })}
              <a
                href={ctaHref || '#contact'}
                onClick={(e) => handleLinkClick(e, ctaHref || '#contact', 'contact')}
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-lg border border-[#8B5CF6]/50 bg-[#8B5CF6]/15 px-4 text-sm font-semibold text-[#F5F5F7]"
              >
                {ctaLabel || "Let's Talk"}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
