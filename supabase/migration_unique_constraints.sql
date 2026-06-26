-- Run this in Supabase SQL Editor to fix the sync

-- 1. Add UNIQUE constraint on external_id
ALTER TABLE teams ADD CONSTRAINT teams_external_id_unique UNIQUE (external_id);
ALTER TABLE matches ADD CONSTRAINT matches_external_id_unique UNIQUE (external_id);

-- 2. Verify
SELECT constraint_name, table_name FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE' AND table_name IN ('teams', 'matches');
