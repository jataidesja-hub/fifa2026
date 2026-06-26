-- FIFA 2026 World Cup Schema
-- Run this in Supabase SQL Editor

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10),
  flag_url TEXT,
  group_name CHAR(1), -- A to L (12 groups)
  confederation VARCHAR(10), -- UEFA, CONMEBOL, CONCACAF, CAF, AFC, OFC
  external_id INTEGER, -- football-data.org ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  position VARCHAR(20), -- GK, DF, MF, FW
  jersey_number INTEGER,
  nationality VARCHAR(100),
  date_of_birth DATE,
  external_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100), -- USA, Canada, Mexico
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  home_score_extra INTEGER,
  away_score_extra INTEGER,
  home_score_penalties INTEGER,
  away_score_penalties INTEGER,
  phase VARCHAR(30) DEFAULT 'GROUP', -- GROUP, R32, R16, QF, SF, THIRD, FINAL
  group_name CHAR(1),
  match_day INTEGER,
  bracket_position INTEGER,
  venue_id UUID REFERENCES venues(id),
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PLAY, PAUSED, FINISHED, POSTPONED
  minute INTEGER,
  external_id INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Events (goals, cards, fouls)
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  type VARCHAR(20) NOT NULL, -- GOAL, OWN_GOAL, YELLOW_CARD, RED_CARD, YELLOW_RED_CARD, SUBSTITUTION, PENALTY_MISSED
  minute INTEGER,
  extra_minute INTEGER,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Standings
CREATE TABLE IF NOT EXISTS standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  group_name CHAR(1) NOT NULL,
  position INTEGER DEFAULT 1,
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_diff INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  form VARCHAR(20), -- e.g. "WWDLW"
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, group_name)
);

-- Knockout Bracket
CREATE TABLE IF NOT EXISTS bracket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round VARCHAR(20) NOT NULL, -- R32, R16, QF, SF, THIRD, FINAL
  position INTEGER NOT NULL,
  match_id UUID REFERENCES matches(id),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  winner_id UUID REFERENCES teams(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round, position)
);

-- Player Stats aggregate
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Sync log
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  matches_updated INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'OK',
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_standings_group ON standings(group_name);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE standings;

-- Auto update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
