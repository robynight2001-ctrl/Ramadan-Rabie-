import {useRef, useState, type ReactNode} from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  target?: string;
  rel?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  href,
  onClick,
  className = '',
  target,
  rel,
  strength = 0.22,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({x: 0, y: 0});

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setOffset({x: dx, y: dy});
  };

  const handleMouseLeave = () => {
    setOffset({x: 0, y: 0});
  };

  const style = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition: offset.x === 0 && offset.y === 0 ? 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={style}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={className}
    >
      {children}
    </button>
  );
}
