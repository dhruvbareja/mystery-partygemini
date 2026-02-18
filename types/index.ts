/* ------------------------------------------------ */
/* MATCH SUPABASE EXACTLY (snake_case only)         */
/* NEVER camelCase DB fields                        */
/* ------------------------------------------------ */

export type GamePhase =
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


/* ---------------- GAME ---------------- */

export type GameData = {
  id: string;
  name: string;

  host_id: string;
  phase: GamePhase;

  story: string;
  victim: string;
  killer: string;

  locations: string[];
  theme: string;

  created_at: string;
  started_at: string | null;
  ended_at: string | null;

  current_round: number;
  max_rounds: number;

  revealed_clues: string[];
  twists: string[];
  ending_text: string;

  settings: {
    timerEnabled: boolean;
    roundDuration: number;
  };
};


/* ---------------- PLAYER ---------------- */

export type Player = {
  id: string;
  game_id: string;

  name: string;
  avatar: string;

  role_id: string | null;

  is_host: boolean;
  is_ready: boolean;
  is_alive: boolean;

  suspicion_level: number;

  joined_at?: string;
  last_active?: string;
};


/* ---------------- ROLE ---------------- */

export type PlayerRole = {
  id: string;
  game_id: string;

  name: string;
  role: string;

  secrets: string[];
  motive: string | null;
  alibi: string;
  personality: string;

  is_killer: boolean;

  avatar: string;
};


/* ---------------- CLUE ---------------- */

export type Clue = {
  id: string;
  game_id: string;

  text: string;
  location: string;

  revealed: boolean;
};


/* ---------------- MESSAGE ---------------- */

export type Message = {
  id: string;
  game_id: string;

  sender_id: string;
  recipient_id: string | null;

  content: string;

  is_system_message: boolean;

  created_at: string;
};


/* ---------------- VOTE ---------------- */

export type Vote = {
  id: string;
  game_id: string;

  voter_id: string;
  accused_id: string;

  round: number;
};