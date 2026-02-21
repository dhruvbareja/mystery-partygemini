'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export default function SectionHeader({
  children,
  className,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className={clsx("mb-4", className)}>
      <h2 className="section-title text-lg">
        {children}
      </h2>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1 tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
}