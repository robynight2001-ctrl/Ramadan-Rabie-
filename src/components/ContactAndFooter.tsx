import {motion} from 'motion/react';
import {ArrowUpRight, Mail, Settings} from 'lucide-react';
import {useEffect, useState} from 'react';
import {FacebookIcon, InstagramIcon, WhatsAppIcon} from '../lib/icons.tsx';
import type {ContentSettings, ProfileSettings, SocialSettings} from '../types/portfolio.ts';
import {MagneticButton} from './MagneticButton.tsx';

interface ContactSectionProps {
  content: ContentSettings;
  social: SocialSettings;
}

export function ContactSection({content, social}: ContactSectionProps) {
  return (
    <section
      id="contact"
      className="relative overflow-hidden py-24 sm:py-32 border-t border-white/[0.06] bg-[#08090D]"
    >
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[820px] rounded-full opacity-25 blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.48) 0%, rgba(168,85,247,0.18) 45%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="rounded-3xl border border-white/[0.08] bg-[#11131B]/70 px-6 py-14 sm:px-12 sm:py-20 lg:px-16 text-center">
          <motion.p
            initial={{opacity: 0, y: 12}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-70px'}}
            transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
            className="font-mono-tabular text-xs font-medium tracking-[0.2em] text-[#A855F7]"
          >
            04. START A CONVERSATION
          </motion.p>

          <motion.h2
            initial={{opacity: 0, y: 18}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-70px'}}
            transition={{duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1]}}
            className="mx-auto mt-4 max-w-3xl font-display text-3xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-[#F5F5F7]"
            style={{textWrap: 'balance'}}
          >
            {content.contactHeadline || "LET'S BUILD SOMETHING GREAT."}
          </motion.h2>

          <motion.p
            initial={{opacity: 0, y: 16}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-70px'}}
            transition={{duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1]}}
            className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#9CA3AF]"
          >
            {content.contactDescription}
          </motion.p>

          <motion.div
            initial={{opacity: 0, y: 16}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-70px'}}
            transition={{duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {social.whatsappLink && (
              <MagneticButton
                href={social.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[50px] items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_12px_36px_rgba(139,92,246,0.35)] transition-shadow hover:shadow-[0_16px_44px_rgba(168,85,247,0.5)] whitespace-nowrap shrink-0"
              >
                <WhatsAppIcon className="h-5 w-5" />
                <span>WhatsApp</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </MagneticButton>
            )}

            {social.instagramUrl && (
              <MagneticButton
                href={social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[50px] items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#08090D]/70 px-6 py-3 text-sm sm:text-base font-medium text-[#F5F5F7] transition-all hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 whitespace-nowrap shrink-0"
              >
                <InstagramIcon className="h-5 w-5 text-[#A855F7]" />
                <span>Instagram</span>
              </MagneticButton>
            )}

            {social.facebookUrl && (
              <MagneticButton
                href={social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[50px] items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#08090D]/70 px-6 py-3 text-sm sm:text-base font-medium text-[#F5F5F7] transition-all hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 whitespace-nowrap shrink-0"
              >
                <FacebookIcon className="h-5 w-5 text-[#A855F7]" />
                <span>Facebook</span>
              </MagneticButton>
            )}

            {social.email && (
              <MagneticButton
                href={`mailto:${social.email}`}
                className="group inline-flex min-h-[50px] items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#08090D]/70 px-6 py-3 text-sm sm:text-base font-medium text-[#F5F5F7] transition-all hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 whitespace-nowrap shrink-0"
              >
                <Mail className="h-5 w-5 text-[#A855F7]" />
                <span>Email</span>
              </MagneticButton>
            )}
          </motion.div>

          {social.whatsappNumber && (
            <p className="mt-6 font-mono-tabular text-xs text-[#9CA3AF]">
              Direct WhatsApp: <span className="text-[#F5F5F7]">{social.whatsappNumber}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

interface FooterProps {
  profile: ProfileSettings;
  content: ContentSettings;
  social: SocialSettings;
  onNavigateSettings: () => void;
}

export function Footer({profile, content, social, onNavigateSettings}: FooterProps) {
  const year = new Date().getFullYear();

  const links = [
    {label: content.navLabels.home || 'Home', href: '#home'},
    {label: content.navLabels.about || 'About', href: '#about'},
    {label: content.navLabels.services || 'Services', href: '#services'},
    {label: content.navLabels.projects || 'Projects', href: '#projects'},
    {label: content.navLabels.contact || 'Contact', href: '#contact'},
  ];

  return (
    <footer className="border-t border-white/[0.08] bg-[#08090D] py-12 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="font-display text-lg font-bold text-[#F5F5F7]">{profile.name}</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">{profile.title}</p>
            {content.footerBio && (
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#9CA3AF]/80">
                {content.footerBio}
              </p>
            )}
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-sm text-[#9CA3AF]" aria-label="Footer Navigation">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(link.href.slice(1))?.scrollIntoView({behavior: 'smooth'});
                }}
                className="transition-colors hover:text-[#F5F5F7] whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {social.instagramUrl && (
              <a
                href={social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#11131B] text-[#9CA3AF] transition-colors hover:border-[#8B5CF6]/50 hover:text-[#F5F5F7]"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {social.facebookUrl && (
              <a
                href={social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#11131B] text-[#9CA3AF] transition-colors hover:border-[#8B5CF6]/50 hover:text-[#F5F5F7]"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
            {social.whatsappLink && (
              <a
                href={social.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#11131B] text-[#9CA3AF] transition-colors hover:border-[#8B5CF6]/50 hover:text-[#F5F5F7]"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-xs text-[#9CA3AF]">
          <p className="font-mono-tabular">
            © {year} {content.footerCopyrightName || profile.name}. All rights reserved.
          </p>
          <a
            href="/settings"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSettings();
            }}
            className="inline-flex items-center gap-1.5 text-[#9CA3AF]/70 transition-colors hover:text-[#F5F5F7]"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Settings</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp({
  whatsappLink,
  enabled,
}: {
  whatsappLink: string;
  enabled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 360);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!enabled || !whatsappLink) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#8B5CF6]/50 bg-[#11131B]/95 text-[#F5F5F7] shadow-[0_12px_32px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-105 hover:border-[#A855F7] hover:bg-[#8B5CF6] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <WhatsAppIcon className="h-5 w-5" />
    </a>
  );
}
