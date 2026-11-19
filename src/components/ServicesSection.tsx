import {motion} from 'motion/react';
import {useState} from 'react';
import {ServiceIcon} from '../lib/icons.tsx';
import type {ServiceItem} from '../types/portfolio.ts';

interface ServicesSectionProps {
  title: string;
  subtitle: string;
  services: ServiceItem[];
}

function ServiceCard({service, index}: {service: ServiceItem; index: number}) {
  const [spotlight, setSpotlight] = useState({x: 50, y: 50, active: false});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlight({x, y, active: true});
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-50px'}}
      transition={{duration: 0.5, delay: Math.min(index * 0.05, 0.35), ease: [0.16, 1, 0.3, 1]}}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpotlight((s) => ({...s, active: false}))}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B]/75 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/50 hover:shadow-[0_18px_50px_rgba(139,92,246,0.12)]"
    >
      {/* Dynamic subtle spotlight glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.active ? 1 : 0,
          background: `radial-gradient(280px circle at ${spotlight.x}% ${spotlight.y}%, rgba(139,92,246,0.14), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A855F7] transition-colors duration-200 group-hover:border-[#A855F7]/60 group-hover:bg-[#8B5CF6]/20">
            <ServiceIcon name={service.icon} className="h-5 w-5" />
          </div>
          <span className="font-mono-tabular text-xs text-[#9CA3AF]/70">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="mt-6 font-display text-lg sm:text-xl font-semibold text-[#F5F5F7] tracking-tight">
          {service.title}
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-[#9CA3AF]">{service.description}</p>
      </div>
    </motion.div>
  );
}

export function ServicesSection({title, subtitle, services}: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="relative py-24 sm:py-32 border-t border-white/[0.06] bg-[#08090D]"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <motion.p
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-70px'}}
              transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              className="font-mono-tabular text-xs font-medium tracking-[0.18em] text-[#A855F7]"
            >
              02. SERVICES & EXPERTISE
            </motion.p>
            <motion.h2
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-70px'}}
              transition={{duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1]}}
              className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[#F5F5F7] max-w-xl"
              style={{textWrap: 'balance'}}
            >
              {title || 'Capabilities & Engineering Services'}
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

        {services.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#11131B]/50 p-10 text-center text-[#9CA3AF]">
            Services are currently being updated in the studio console.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, idx) => (
              <ServiceCard key={service.id} service={service} index={idx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
