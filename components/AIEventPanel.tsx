

'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AIEvent {
  id: string;
  type: 'narrative' | 'escalation' | 'suspicion' | 'major';
  content: string;
  round?: number;
  created_at?: string;
}

interface Props {
  events: AIEvent[];
}

const TYPE_STYLES: Record<string, string> = {
  narrative: 'bg-blue-900/20 border-blue-500/40 text-blue-200',
  escalation: 'bg-red-900/20 border-red-500/40 text-red-200',
  suspicion: 'bg-yellow-900/20 border-yellow-500/40 text-yellow-200',
  major: 'bg-purple-900/20 border-purple-500/40 text-purple-200'
};

const TYPE_LABELS: Record<string, string> = {
  narrative: '📝 Narrative',
  escalation: '⚠ Escalation',
  suspicion: '👁 Suspicion Shift',
  major: '🔥 Major Event'
};

export default function AIEventPanel({ events = [] }: Props) {
  return (
    <div className="relative bg-gradient-to-br from-[#1a1a1f] to-[#111116] border-2 border-yellow-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,215,0,0.15)] space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-yellow-400 tracking-wide">
          🤖 AI Director
        </h3>
        <span className="text-xs text-neutral-500">
          Live Narrative Engine
        </span>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-neutral-500">
          No AI events yet. The story will evolve as players act.
        </p>
      )}

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        <AnimatePresence>
          {events.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`border rounded-xl p-4 ${TYPE_STYLES[event.type]}`}
            >
              <div className="flex justify-between items-center mb-2 text-xs font-semibold">
                <span>{TYPE_LABELS[event.type]}</span>
                {event.round && (
                  <span className="opacity-60">
                    Round {event.round}
                  </span>
                )}
              </div>

              <div className="text-sm leading-relaxed">
                {event.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}