'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PlayerFaceCardProps {
  name: string;
  avatar?: string;
  isAlive?: boolean;
  suspicion?: number; // 0–100
  allianceTag?: string | null;
  isHostView?: boolean;
}

export default function PlayerFaceCard({
  name,
  avatar,
  isAlive = true,
  suspicion = 0,
  allianceTag,
  isHostView = false,
}: PlayerFaceCardProps) {
  const suspicionLevel =
    suspicion < 33 ? 'low' : suspicion < 66 ? 'medium' : 'high';

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="relative bg-gradient-to-b from-neutral-900 to-black border border-neutral-700 rounded-2xl p-4 w-56 shadow-lg"
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-3xl border border-neutral-600 shadow-inner">
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

      {/* Suspicion Meter */}
      {isHostView && (
        <div className="mt-4">
          <p className="text-xs text-neutral-400 mb-1 text-center">
            Suspicion Level
          </p>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-500',
                suspicionLevel === 'low' && 'bg-green-500',
                suspicionLevel === 'medium' && 'bg-yellow-500',
                suspicionLevel === 'high' && 'bg-red-600'
              )}
              style={{ width: `${suspicion}%` }}
            />
          </div>
        </div>
      )}

      {/* Alliance Tag */}
      {allianceTag && (
        <div className="absolute top-2 right-2 text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full border border-purple-600">
          {allianceTag}
        </div>
      )}
    </motion.div>
  );
}
