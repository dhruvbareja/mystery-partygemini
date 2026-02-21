'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassPanel({
  children,
  className,
  hover = false,
  glow = false,
}: GlassPanelProps) {
  return (
    <div
      className={clsx(
        'glass-panel p-6',
        hover && 'glass-panel-hover',
        glow && 'gold-border-glow',
        className
      )}
    >
      {children}
    </div>
  );
}