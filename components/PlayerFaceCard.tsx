'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useState } from 'react';

interface PlayerFaceCardProps {
  name: string;
  avatar?: string;
  isAlive?: boolean;
  suspicion?: number; // 0–100
  allianceTag?: string | null;
  isHostView?: boolean;

  // Intelligence tooltip data (host view only)
  motive?: string;
  trueLocation?: string;
  alliances?: string[];
}

export default function PlayerFaceCard({
  name,
  avatar,
  isAlive = true,
  suspicion = 0,
  allianceTag,
  isHostView = false,
  motive,
  trueLocation,
  alliances = [],
}: PlayerFaceCardProps) {
  const [hovered, setHovered] = useState(false);

  const cappedSuspicion = Math.min(suspicion, 100);

  const suspicionLevel =
    cappedSuspicion < 33 ? 'low' : cappedSuspicion < 66 ? 'medium' : 'high';

  const isCritical = cappedSuspicion >= 70;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 220 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'relative bg-gradient-to-b from-neutral-900 to-black border rounded-2xl p-4 w-56 shadow-lg transition-all duration-300',
        isCritical
          ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
          : 'border-neutral-700'
      )}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div
          className={clsx(
            'w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-3xl border shadow-inner transition-all',
            isCritical && 'border-red-500 animate-pulse',
            !isCritical && 'border-neutral-600'
          )}
        >
          {avatar || '🎭'}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-center text-lg font-semibold tracking-wide">
        {name}
      </h3>

      {/* Alive / Dead Badge */}
      <div className="flex justify-center mt-1">
        <span
          className={clsx(
            'text-xs px-2 py-0.5 rounded-full',
            isAlive
              ? 'bg-green-900 text-green-300'
              : 'bg-red-900 text-red-300'
          )}
        >
          {isAlive ? 'Alive' : 'Eliminated'}
        </span>
      </div>

      {/* Alliance Badges */}
      {alliances.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {alliances.map((a, i) => (
            <span
              key={i}
              className="text-[9px] bg-purple-900/80 text-purple-300 px-2 py-0.5 rounded-full border border-purple-600"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Suspicion Meter */}
      {isHostView && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>Suspicion</span>
            <span className="font-semibold text-neutral-200">
              {cappedSuspicion}%
            </span>
          </div>

          <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cappedSuspicion}%` }}
              transition={{ duration: 0.6 }}
              className={clsx(
                'h-full rounded-full',
                suspicionLevel === 'low' &&
                  'bg-gradient-to-r from-green-500 to-green-400',
                suspicionLevel === 'medium' &&
                  'bg-gradient-to-r from-yellow-500 to-orange-500',
                suspicionLevel === 'high' &&
                  'bg-gradient-to-r from-red-600 to-red-400'
              )}
            />
          </div>

          <p
            className={clsx(
              'text-[10px] text-center font-medium',
              suspicionLevel === 'low' && 'text-green-400',
              suspicionLevel === 'medium' && 'text-yellow-400',
              suspicionLevel === 'high' && 'text-red-400'
            )}
          >
            {suspicionLevel === 'low' && 'Low Risk'}
            {suspicionLevel === 'medium' && 'Under Watch'}
            {suspicionLevel === 'high' && 'Highly Suspect'}
          </p>
        </div>
      )}

      {/* Intelligence Tooltip (Host Only) */}
      {hovered && isHostView && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 translate-y-full w-64 bg-black border border-yellow-500 rounded-xl p-3 shadow-2xl z-50"
        >
          <div className="text-xs text-yellow-400 font-semibold mb-1">
            Intelligence Snapshot
          </div>

          {motive && (
            <div className="text-[11px] text-neutral-300 mb-1">
              <span className="text-neutral-500">Motive:</span> {motive}
            </div>
          )}

          {trueLocation && (
            <div className="text-[11px] text-neutral-300 mb-1">
              <span className="text-neutral-500">True Location:</span>{' '}
              {trueLocation}
            </div>
          )}

          {alliances.length > 0 && (
            <div className="text-[11px] text-neutral-300">
              <span className="text-neutral-500">Alliances:</span>{' '}
              {alliances.join(', ')}
            </div>
          )}
        </motion.div>
      )}

      {/* Alliance Tag (Corner Label) */}
      {allianceTag && (
        <div className="absolute top-2 right-2 text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full border border-purple-600">
          {allianceTag}
        </div>
      )}
    </motion.div>
  );
}
