import {AnimatePresence, motion} from 'motion/react';
import {useEffect, useState} from 'react';

interface CinematicLoaderProps {
  name?: string;
  enabled?: boolean;
  onComplete?: () => void;
}

const LOADER_SESSION_KEY = 'rr_intro_played';

export function CinematicLoader({
  name = 'RAMADAN RABIE',
  enabled = true,
  onComplete,
}: CinematicLoaderProps) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (!enabled) return false;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return sessionStorage.getItem(LOADER_SESSION_KEY) !== '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) {
      onComplete?.();
      return;
    }
    try {
      sessionStorage.setItem(LOADER_SESSION_KEY, '1');
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [visible, onComplete]);

  const letters = name.toUpperCase().split('');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{opacity: 1}}
          exit={{opacity: 0, transition: {duration: 0.45, ease: [0.16, 1, 0.3, 1]}}}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08090D] px-6 select-none"
          aria-hidden="true"
        >
          {/* Subtle radial glow */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full opacity-35 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(168,85,247,0.12) 55%, transparent 75%)',
            }}
          />

          <div className="relative flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-[0.06em] overflow-hidden">
              {letters.map((char, i) => (
                <motion.span
                  key={`${char}-${i}`}
                  initial={{opacity: 0, y: 18, filter: 'blur(6px)'}}
                  animate={{opacity: 1, y: 0, filter: 'blur(0px)'}}
                  transition={{
                    duration: 0.45,
                    delay: 0.04 + i * 0.025,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[0.2em] text-[#F5F5F7]"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </div>

            {/* Subtle animated loading line */}
            <div className="relative h-[1px] w-52 sm:w-64 overflow-hidden bg-white/10">
              <motion.div
                initial={{scaleX: 0}}
                animate={{scaleX: 1}}
                transition={{duration: 0.95, delay: 0.12, ease: [0.16, 1, 0.3, 1]}}
                className="h-full w-full origin-left bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#F5F5F7]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
