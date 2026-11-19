import {motion, useScroll, useTransform} from 'motion/react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import {useRef, useState} from 'react';
import type {ProfileSettings} from '../types/portfolio.ts';
import {HeroScene3D} from './HeroScene3D.tsx';
import {MagneticButton} from './MagneticButton.tsx';

interface HeroSectionProps {
  profile: ProfileSettings;
  enable3D: boolean;
}

export function HeroSection({profile, enable3D}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [imgError, setImgError] = useState(false);

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const portraitY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);

  const headlineWords = (profile.heroHeadline || '').split(' ').filter(Boolean);

  const handleCtaScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.getElementById(href.slice(1));
      target?.scrollIntoView({behavior: 'smooth'});
    }
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-[#08090D] pt-28 pb-20 lg:pt-32 lg:pb-24"
    >
      {/* Optional custom hero background image from Settings */}
      {profile.heroBgImage && (
        <motion.div
          style={{y: bgY}}
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          aria-hidden="true"
        >
          <img
            src={profile.heroBgImage}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090D]/70 via-[#08090D]/80 to-[#08090D]" />
        </motion.div>
      )}

      {/* Subtle ambient purple radial glow */}
      <div
        className="pointer-events-none absolute top-[-15%] left-1/2 -translate-x-1/2 h-[640px] w-[960px] rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.45) 0%, rgba(168,85,247,0.16) 45%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle perspective grid */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-12%] h-[58%] overflow-hidden opacity-55"
        aria-hidden="true"
      >
        <div className="hero-perspective-grid h-full w-full" />
      </div>

      {/* Interactive 3D orbital wireframe/crystalline background */}
      <HeroScene3D enabled={enable3D} />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Typographic Column */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Availability Indicator (clean hairline, static indicator — no pulsing dots) */}
            {profile.availabilityActive && profile.availabilityStatus && (
              <motion.div
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1]}}
                className="mb-6 inline-flex items-center gap-2.5 border border-white/[0.1] bg-[#11131B]/80 px-3.5 py-1.5 rounded-lg"
              >
                <span
                  className="h-2 w-2 rotate-45 rounded-[1px] bg-[#A855F7] shrink-0"
                  aria-hidden="true"
                />
                <span className="font-mono-tabular text-[11px] font-medium tracking-[0.14em] text-[#F5F5F7]">
                  {profile.availabilityStatus}
                </span>
              </motion.div>
            )}

            {/* Identity Lockup */}
            <motion.div
              initial={{opacity: 0, y: 14}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1]}}
              className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base"
            >
              <span className="font-display font-semibold tracking-wide text-[#F5F5F7]">
                {profile.name}
              </span>
              <span className="text-[#8B5CF6]" aria-hidden="true">
                /
              </span>
              <span className="text-[#9CA3AF] font-medium">{profile.title}</span>
            </motion.div>

            {/* Word-by-word Animated Headline */}
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.15rem] font-bold leading-[1.06] tracking-[-0.025em] text-[#F5F5F7] max-w-2xl"
              style={{textWrap: 'balance'}}
            >
              {headlineWords.map((word, idx) => {
                const isHighlighted =
                  word.toLowerCase().includes('powerful') ||
                  word.toLowerCase().includes('digital') ||
                  word.toLowerCase().includes('experiences');
                return (
                  <span key={`${word}-${idx}`} className="inline-block overflow-hidden mr-[0.26em] pb-1">
                    <motion.span
                      initial={{y: '110%', opacity: 0}}
                      animate={{y: '0%', opacity: 1}}
                      transition={{
                        duration: 0.65,
                        delay: 0.18 + idx * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`inline-block ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-[#F5F5F7] via-[#C4B5FD] to-[#A855F7] bg-clip-text text-transparent'
                          : ''
                      }`}
                    >
                      {word}
                    </motion.span>
                  </span>
                );
              })}
            </h1>

            {/* Lead Description */}
            <motion.p
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.65, delay: 0.48, ease: [0.16, 1, 0.3, 1]}}
              className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#9CA3AF]"
            >
              {profile.heroDescription}
            </motion.p>

            {/* Primary & Secondary CTAs */}
            <motion.div
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.65, delay: 0.58, ease: [0.16, 1, 0.3, 1]}}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <MagneticButton
                href={profile.primaryCtaHref || '#projects'}
                onClick={(e?: React.MouseEvent<HTMLElement>) => {
                  if (e && (profile.primaryCtaHref || '#projects').startsWith('#')) {
                    handleCtaScroll(
                      e as React.MouseEvent<HTMLAnchorElement>,
                      profile.primaryCtaHref || '#projects'
                    );
                  }
                }}
                className="group inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_10px_35px_rgba(139,92,246,0.35)] transition-all duration-200 hover:shadow-[0_14px_42px_rgba(168,85,247,0.5)] whitespace-nowrap shrink-0"
              >
                <span>{profile.primaryCtaLabel || 'View My Work'}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </MagneticButton>

              <MagneticButton
                href={profile.secondaryCtaHref || '#contact'}
                onClick={(e?: React.MouseEvent<HTMLElement>) => {
                  if (e && (profile.secondaryCtaHref || '#contact').startsWith('#')) {
                    handleCtaScroll(
                      e as React.MouseEvent<HTMLAnchorElement>,
                      profile.secondaryCtaHref || '#contact'
                    );
                  }
                }}
                className="group inline-flex min-h-[48px] items-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#11131B]/80 px-6 py-3 text-sm sm:text-base font-medium text-[#F5F5F7] transition-all duration-200 hover:border-[#8B5CF6]/60 hover:bg-[#11131B] whitespace-nowrap shrink-0"
              >
                <span>{profile.secondaryCtaLabel || "Let's Talk"}</span>
                <ArrowUpRight className="h-4 w-4 text-[#A855F7] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </MagneticButton>
            </motion.div>
          </div>

          {/* Right Portrait Showcase Column */}
          <motion.div
            style={{y: portraitY}}
            initial={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
            animate={{opacity: 1, scale: 1, filter: 'blur(0px)'}}
            transition={{duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1]}}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[380px] lg:max-w-[420px]">
              {/* Subtle violet rim glow behind portrait frame */}
              <div
                className="pointer-events-none absolute -inset-4 rounded-3xl opacity-45 blur-2xl"
                style={{
                  background:
                    'radial-gradient(circle at 70% 25%, rgba(168,85,247,0.35), rgba(139,92,246,0.12) 55%, transparent 75%)',
                }}
                aria-hidden="true"
              />

              <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#11131B] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                <div className="aspect-[3/4] w-full overflow-hidden">
                  {profile.profileImage && !imgError ? (
                    <img
                      src={profile.profileImage}
                      alt={`${profile.name} — ${profile.title}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#11131B] via-[#151824] to-[#08090D] p-8 text-center">
                      <span className="font-display text-5xl font-bold tracking-tight text-white/90">
                        {profile.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="mt-3 text-sm text-[#9CA3AF]">{profile.name}</span>
                    </div>
                  )}
                </div>

                {/* Bottom subtle scrim with clean unboxed identity caption */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08090D]/90 via-[#08090D]/45 to-transparent p-6 pt-16">
                  <p className="font-display text-lg font-semibold text-[#F5F5F7]">{profile.name}</p>
                  <p className="mt-0.5 text-xs tracking-wide text-[#9CA3AF]">{profile.title}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
