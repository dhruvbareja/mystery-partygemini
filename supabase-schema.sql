-- Mystery Party Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby',
  story TEXT NOT NULL,
  victim TEXT NOT NULL,
  killer TEXT NOT NULL,
  locations TEXT[] NOT NULL,
  theme TEXT NOT NULL,
  revealed_clues TEXT[] DEFAULT ARRAY[]::TEXT[],
  twists TEXT[] DEFAULT ARRAY[]::TEXT[],
  ending_text TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 6,
  settings JSONB DEFAULT '{"timerEnabled": true, "roundDuration": 300}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Roles/Characters table
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  secrets TEXT[] NOT NULL,
  motive TEXT,
  alibi TEXT NOT NULL,
  personality TEXT NOT NULL,
  is_killer BOOLEAN DEFAULT FALSE,
  avatar TEXT NOT NULL
);

-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role_id TEXT REFERENCES roles(id),
  is_host BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  is_alive BOOLEAN DEFAULT TRUE,
  suspicion_level INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clues table
CREATE TABLE clues (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  location TEXT NOT NULL,
  revealed BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMP WITH TIME ZONE
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  accused_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, voter_id, round)
);

-- Game logs table
CREATE TABLE game_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_messages_game_id ON messages(game_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_votes_game_id ON votes(game_id);
CREATE INDEX idx_clues_game_id ON clues(game_id);
CREATE INDEX idx_roles_game_id ON roles(game_id);
CREATE INDEX idx_game_logs_game_id ON game_logs(game_id);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for simplicity - adjust for production)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on roles" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all operations on clues" ON clues FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_logs" ON game_logs FOR ALL USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE roles;
ALTER PUBLICATION supabase_realtime ADD TABLE clues;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE game_logs;
