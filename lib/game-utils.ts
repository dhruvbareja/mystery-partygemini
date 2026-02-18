import { GamePhase } from '@/types';

export const PHASE_LABELS: Record<GamePhase, string> = {
  lobby: 'Waiting Room',
  role_reveal: 'Role Assignment',
  intro_round: 'Introductions',
  investigation: 'Investigation',
  clue_drop: 'Clue Discovery',
  accusations: 'Accusations',
  voting: 'Final Vote',
  reveal: 'The Truth Revealed',
  finished: 'Game Over',
};

export const PHASE_DURATIONS: Record<GamePhase, number> = {
  lobby: 0,
  role_reveal: 30,
  intro_round: 120,
  investigation: 300,
  clue_drop: 60,
  accusations: 180,
  voting: 120,
  reveal: 60,
  finished: 0,
};

export const getPhaseDescription = (phase: GamePhase): string => {
  const descriptions: Record<GamePhase, string> = {
    lobby: 'Players are joining...',
    role_reveal: 'Review your secret role and objectives',
    intro_round: 'Introduce yourself to other players',
    investigation: 'Search for clues and interrogate suspects',
    clue_drop: 'New evidence has been discovered!',
    accusations: 'Time to make your case',
    voting: 'Cast your vote for the killer',
    reveal: 'The truth comes to light...',
    finished: 'Thanks for playing!',
  };
  return descriptions[phase];
};

export const calculateSuspicion = (
  playerId: string,
  messages: any[],
  votes: any[]
): number => {
  const votesAgainst = votes.filter(v => v.accused_id === playerId).length;
  const messageCount = messages.filter(m => m.sender_id === playerId).length;

  const suspicionFromVotes = votesAgainst * 20;
  const suspicionFromActivity = Math.min(messageCount * 2, 30);

  return Math.min(
    suspicionFromVotes + Math.random() * 50 - suspicionFromActivity,
    100
  );
};

export const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const generateGameCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
