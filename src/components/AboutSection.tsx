import {motion} from 'motion/react';
import {Check} from 'lucide-react';
import {useState} from 'react';
import type {ProfileSettings, SkillItem} from '../types/portfolio.ts';

interface AboutSectionProps {
  profile: ProfileSettings;
  skills: SkillItem[];
  skillsTitle: string;
}

export function AboutSection({profile, skills, skillsTitle}: AboutSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section id="about" className="relative py-24 sm:py-32 border-t border-white/[0.06] bg-[#08090D]">
      {/* Subtle side ambient illumination */}
      <div
        className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full opacity-20 blur-[120px]"
        style={{background: 'radial-gradient(circle, rgba(139,92,246,0.45), transparent 70%)'}}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Studio Visual with Clip-Path Mask Reveal */}
          <motion.div
            initial={{opacity: 0, clipPath: 'inset(12% 0% 12% 0%)'}}
            whileInView={{opacity: 1, clipPath: 'inset(0% 0% 0% 0%)'}}
            viewport={{once: true, margin: '-80px'}}
            transition={{duration: 0.85, ease: [0.16, 1, 0.3, 1]}}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B]">
              {profile.aboutImage && !imgError ? (
                <img
                  src={profile.aboutImage}
                  alt="Software engineering studio workspace"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center bg-gradient-to-br from-[#11131B] to-[#08090D] p-8 text-center">
                  <span className="font-display text-xl font-semibold text-[#F5F5F7]">
                    Crafted with Precision
                  </span>
                  <span className="mt-2 text-sm text-[#9CA3AF]">
                    Engineering modern digital products
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090D]/60 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* Right Narrative & Highlights */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <motion.p
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-80px'}}
              transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              className="font-mono-tabular text-xs font-medium tracking-[0.18em] text-[#A855F7]"
            >
              01. PROFILE & APPROACH
            </motion.p>

            <motion.h2
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-80px'}}
              transition={{duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1]}}
              className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[#F5F5F7]"
              style={{textWrap: 'balance'}}
            >
              {profile.aboutHeading || 'A LITTLE ABOUT ME'}
            </motion.h2>

            <motion.p
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-80px'}}
              transition={{duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1]}}
              className="mt-6 text-base sm:text-lg leading-relaxed text-[#9CA3AF] max-w-2xl"
            >
              {profile.aboutText}
            </motion.p>

            {/* Architectural Highlights List */}
            {profile.aboutHighlights && profile.aboutHighlights.length > 0 && (
              <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 border-t border-white/[0.08] pt-8">
                {profile.aboutHighlights.map((highlight, idx) => (
                  <motion.div
                    key={`${highlight}-${idx}`}
                    initial={{opacity: 0, y: 12}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: '-60px'}}
                    transition={{
                      duration: 0.45,
                      delay: 0.06 * idx,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-center gap-3 text-sm sm:text-[15px] text-[#F5F5F7]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#A855F7]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{highlight}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Core Technical Stack Strip (Editable via Services & Skills Dashboard) */}
        {skills.length > 0 && (
          <motion.div
            initial={{opacity: 0, y: 18}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-60px'}}
            transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
            className="mt-20 border-t border-white/[0.08] pt-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F5F5F7]">
                {skillsTitle || 'Core Stack & Craft'}
              </h3>
              <span className="text-xs font-mono-tabular text-[#9CA3AF]">
                {skills.length} CORE TECHNOLOGIES
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {skills.map((skill, idx) => (
                <motion.div
                  key={skill.id}
                  initial={{opacity: 0, y: 14}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-40px'}}
                  transition={{duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1]}}
                  className="group rounded-xl border border-white/[0.07] bg-[#11131B]/65 p-4 transition-colors duration-200 hover:border-[#8B5CF6]/45"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#9CA3AF] truncate">{skill.category}</span>
                    <span className="font-mono-tabular text-xs text-[#A855F7]">
                      {skill.proficiency}%
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-base font-semibold text-[#F5F5F7] truncate">
                    {skill.name}
                  </p>
                  <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-transform duration-500 origin-left"
                      style={{width: `${Math.min(100, Math.max(10, skill.proficiency))}%`}}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
