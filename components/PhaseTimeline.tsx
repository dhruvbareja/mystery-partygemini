

'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

type GamePhase =
  | 'lobby'
  | 'role_reveal'
  | 'intro_round'
  | 'investigation'
  | 'clue_drop'
  | 'accusations'
  | 'voting'
  | 'reveal'
  | 'finished'
  | 'paused';

interface Props {
  phase: GamePhase;
  currentRound: number;
  maxRounds?: number;
}

const PHASE_ORDER: GamePhase[] = [
  'lobby',
  'role_reveal',
  'intro_round',
  'investigation',
  'voting',
  'reveal'
];

const PHASE_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  role_reveal: 'Role Reveal',
  intro_round: 'Intro',
  investigation: 'Investigation',
  voting: 'Voting',
  reveal: 'Reveal',
  finished: 'Finished',
  paused: 'Paused'
};

export default function PhaseTimeline({
  phase,
  currentRound,
  maxRounds = 6
}: Props) {

  const currentIndex = PHASE_ORDER.indexOf(phase);
  const progressPercent =
    currentIndex <= 0
      ? 0
      : (currentIndex / (PHASE_ORDER.length - 1)) * 100;

  return (
    <div className="bg-gradient-to-r from-[#111118] to-[#1a1a26] border border-neutral-700 rounded-2xl p-6 shadow-lg space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gold tracking-wide">
          🎬 Game Progress
        </h2>

        <div className="text-sm text-neutral-400">
          Round {currentRound} / {maxRounds}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-yellow-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Phase Labels */}
      <div className="flex justify-between text-xs">
        {PHASE_ORDER.map((p, index) => {
          const isActive = p === phase;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={p}
              className={clsx(
                'flex flex-col items-center gap-1',
                isActive && 'text-gold',
                isCompleted && 'text-green-400',
                !isActive && !isCompleted && 'text-neutral-500'
              )}
            >
              <div
                className={clsx(
                  'w-3 h-3 rounded-full',
                  isActive && 'bg-gold shadow-lg shadow-yellow-500/40',
                  isCompleted && 'bg-green-500',
                  !isActive && !isCompleted && 'bg-neutral-700'
                )}
              />

              <span>{PHASE_LABELS[p]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}