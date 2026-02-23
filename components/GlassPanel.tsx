'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  severity?: 'gold' | 'red' | 'blue';
  title?: string;
}

export default function GlassPanel({
  children,
  className,
  hover = false,
  glow = false,
  severity = 'gold',
  title
}: GlassPanelProps) {

  const severityStyles = {
    gold: 'border-yellow-500/40 shadow-[0_0_25px_rgba(255,215,0,0.25)]',
    red: 'border-red-500/40 shadow-[0_0_25px_rgba(255,0,0,0.25)]',
    blue: 'border-blue-500/40 shadow-[0_0_25px_rgba(0,120,255,0.25)]'
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border transition-all duration-500',
        'p-6',
        hover && 'hover:scale-[1.01] hover:bg-white/10',
        glow && severityStyles[severity],
        className
      )}
    >
      {/* Animated Glow Ring */}
      {glow && (
        <div className={clsx(
          'absolute inset-0 rounded-2xl pointer-events-none animate-pulse',
          severity === 'gold' && 'ring-1 ring-yellow-400/30',
          severity === 'red' && 'ring-1 ring-red-400/30',
          severity === 'blue' && 'ring-1 ring-blue-400/30'
        )} />
      )}

      {/* Subtle Shimmer Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_6s_linear_infinite]" />
      </div>

      {title && (
        <div className="mb-4 text-sm uppercase tracking-widest text-gray-400">
          {title}
        </div>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}