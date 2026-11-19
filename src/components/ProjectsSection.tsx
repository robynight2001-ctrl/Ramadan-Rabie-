import {motion} from 'motion/react';
import {ArrowUpRight, Bookmark, FolderGit2, Layers} from 'lucide-react';
import {useMemo, useState} from 'react';
import type {ProjectItem} from '../types/portfolio.ts';

interface ProjectsSectionProps {
  title: string;
  subtitle: string;
  projects: ProjectItem[];
}

function ProjectCard({project, index}: {project: ProjectItem; index: number}) {
  const [tilt, setTilt] = useState({rx: 0, ry: 0, gx: 50, gy: 50, hovering: false});
  const [imgError, setImgError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 9;
    const rx = (0.5 - py) * 9;
    setTilt({rx, ry, gx: px * 100, gy: py * 100, hovering: true});
  };

  const handleMouseLeave = () => {
    setTilt({rx: 0, ry: 0, gx: 50, gy: 50, hovering: false});
  };

  const metadataParts = [
    project.category,
    project.clientName ? `Client: ${project.clientName}` : '',
    ...project.technologies.slice(0, 4),
  ].filter(Boolean);

  return (
    <motion.article
      initial={{opacity: 0, y: 24}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.55, delay: Math.min(index * 0.08, 0.35), ease: [0.16, 1, 0.3, 1]}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor="project"
      style={{
        transform: tilt.hovering
          ? `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-4px)`
          : 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: tilt.hovering
          ? 'transform 120ms ease-out'
          : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B]/85 transition-colors duration-300 hover:border-[#8B5CF6]/55 hover:shadow-[0_24px_70px_rgba(139,92,246,0.16)]"
    >
      {/* Moving specular light reflection */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: tilt.hovering ? 1 : 0,
          background: `radial-gradient(360px circle at ${tilt.gx}% ${tilt.gy}%, rgba(168,85,247,0.15), transparent 65%)`,
        }}
        aria-hidden="true"
      />

      {/* Project Cover Media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0B0D14]">
        {project.coverImage && !imgError ? (
          <img
            src={project.coverImage}
            alt={project.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#161925] via-[#11131B] to-[#08090D] p-6 text-center">
            <Layers className="h-8 w-8 text-[#8B5CF6]/70" aria-hidden="true" />
            <span className="mt-2 font-display text-sm font-medium text-[#9CA3AF]">
              {project.title}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#11131B] via-transparent to-transparent opacity-80" />

        {/* Subtle featured marker (clean unboxed text, not a pill sandwich) */}
        {project.isFeatured && (
          <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-md bg-[#08090D]/80 px-2.5 py-1 text-[11px] font-medium text-[#C4B5FD] border border-[#8B5CF6]/35">
            <Bookmark className="h-3 w-3 text-[#A855F7]" aria-hidden="true" />
            <span>Featured</span>
          </div>
        )}

        {/* Floating arrow button */}
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${project.title} live website`}
          className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#08090D]/80 text-[#F5F5F7] transition-all duration-300 group-hover:border-[#A855F7] group-hover:bg-[#8B5CF6] group-hover:text-white group-hover:scale-105"
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

      {/* Card Body */}
      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
        {/* Unboxed metadata with typographic separators */}
        {metadataParts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#9CA3AF]">
            {metadataParts.map((part, idx) => (
              <span key={`${part}-${idx}`} className="inline-flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-[#8B5CF6]/70" aria-hidden="true">
                    ·
                  </span>
                )}
                <span className={idx === 0 ? 'text-[#C4B5FD] font-medium' : ''}>{part}</span>
              </span>
            ))}
          </div>
        )}

        <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F7]">
          {project.title}
        </h3>

        <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-[#9CA3AF] line-clamp-3">
          {project.description}
        </p>

        <div className="mt-auto pt-6">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#F5F5F7] transition-all duration-200 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/15 hover:text-white whitespace-nowrap shrink-0"
          >
            <span>View Live Website</span>
            <ArrowUpRight className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export function ProjectsSection({title, subtitle, projects}: ProjectsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
    return unique.length > 1 ? ['All', ...unique] : [];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <section
      id="projects"
      className="relative py-24 sm:py-32 border-t border-white/[0.06] bg-[#08090D]"
    >
      {/* Subtle radial backlight */}
      <div
        className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 h-[420px] w-[760px] rounded-full opacity-15 blur-[130px]"
        style={{background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent 70%)'}}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <motion.p
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-70px'}}
              transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              className="font-mono-tabular text-xs font-medium tracking-[0.18em] text-[#A855F7]"
            >
              03. PORTFOLIO SHOWCASE
            </motion.p>
            <motion.h2
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-70px'}}
              transition={{duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1]}}
              className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[#F5F5F7]"
              style={{textWrap: 'balance'}}
            >
              {title || 'Selected Client Projects'}
            </motion.h2>
          </div>

          <motion.p
            initial={{opacity: 0, y: 14}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-70px'}}
            transition={{duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1]}}
            className="max-w-md text-sm sm:text-base leading-relaxed text-[#9CA3AF]"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Category Filter Tabs (only shown when >1 category exists) */}
        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#11131B]/70 p-1.5 w-fit">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#9CA3AF] hover:text-[#F5F5F7]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State vs Live Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{opacity: 0, y: 18}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-60px'}}
            transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B]/65 px-8 py-16 sm:py-20 text-center"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.22), transparent 65%)',
              }}
              aria-hidden="true"
            />
            <div className="relative z-10 mx-auto max-w-lg flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#A855F7]">
                <FolderGit2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-[#F5F5F7]">
                Portfolio Gallery Ready for Launch
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#9CA3AF]">
                No client projects have been published yet. Add real client websites, custom cover
                photography, and live launch links directly from the Settings dashboard.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'});
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-[0_10px_30px_rgba(139,92,246,0.35)]"
                >
                  <span>Start a Project Together</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <ProjectCard key={project.id} project={project} index={idx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
