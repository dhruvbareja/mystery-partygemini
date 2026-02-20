'use client';

import { Clue } from '@/types';

export default function ClueBoard({ clues }: { clues: Clue[] }) {
  return (
    <div className="space-y-3">
      {clues.length === 0 && (
        <div className="text-gray-400">
          No clues revealed yet.
        </div>
      )}

      {clues.map(c => (
        <div key={c.id} className="bg-gray-900 p-3 rounded">
          <div className="font-bold">📍 {c.location}</div>
          <div className="text-sm">{c.text}</div>
        </div>
      ))}
    </div>
  );
}