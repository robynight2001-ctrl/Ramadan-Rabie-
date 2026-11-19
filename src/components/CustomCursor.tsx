import {useEffect, useRef, useState} from 'react';

interface CustomCursorProps {
  enabled: boolean;
}

export function CustomCursor({enabled}: CustomCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isActiveDevice, setIsActiveDevice] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'interactive' | 'project'>('default');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsActiveDevice(false);
      document.body.classList.remove('custom-cursor-enabled');
      return;
    }

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) {
      setIsActiveDevice(false);
      document.body.classList.remove('custom-cursor-enabled');
      return;
    }

    setIsActiveDevice(true);
    document.body.classList.add('custom-cursor-enabled');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      const target = e.target as HTMLElement | null;
      if (!target) {
        setCursorMode('default');
        return;
      }

      if (target.closest('[data-cursor="project"]')) {
        setCursorMode('project');
      } else if (
        target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="interactive"]')
      ) {
        setCursorMode('interactive');
      } else {
        setCursorMode('default');
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove, {passive: true});
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.body.classList.remove('custom-cursor-enabled');
    };
  }, [enabled]);

  if (!isActiveDevice || !enabled) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[90] transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Center dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full bg-[#F5F5F7] transition-all duration-150 ${
          cursorMode === 'project'
            ? 'h-0 w-0 opacity-0'
            : cursorMode === 'interactive'
              ? 'h-2 w-2 bg-[#A855F7]'
              : 'h-1.5 w-1.5 shadow-[0_0_10px_rgba(168,85,247,0.85)]'
        }`}
      />

      {/* Delayed outer ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 flex items-center justify-center rounded-full border transition-[width,height,border-color,background-color] duration-200 ease-out ${
          cursorMode === 'project'
            ? 'h-20 w-20 border-[#A855F7]/70 bg-[#08090D]/85 shadow-[0_0_24px_rgba(139,92,246,0.35)]'
            : cursorMode === 'interactive'
              ? 'h-11 w-11 border-[#8B5CF6]/80 bg-[#8B5CF6]/10'
              : 'h-8 w-8 border-white/30 bg-transparent'
        }`}
      >
        {cursorMode === 'project' && (
          <span className="font-mono-tabular text-[9px] font-medium tracking-[0.14em] text-[#F5F5F7] whitespace-nowrap">
            VIEW PROJECT
          </span>
        )}
      </div>
    </div>
  );
}
