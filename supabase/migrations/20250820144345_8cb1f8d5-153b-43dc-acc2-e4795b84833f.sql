-- Add unique constraints to tables for proper upsert functionality
ALTER TABLE players ADD CONSTRAINT unique_player_name UNIQUE (name);
ALTER TABLE tournaments ADD CONSTRAINT unique_tournament_name UNIQUE (name);

-- Update tournament data with current 2025 dates
UPDATE tournaments SET 
  start_date = '2025-01-13',
  end_date = '2025-01-26',
  status = 'completed'
WHERE name = 'Australian Open';

UPDATE tournaments SET 
  start_date = '2025-05-25',
  end_date = '2025-06-08', 
  status = 'completed'
WHERE name = 'Roland Garros';

UPDATE tournaments SET 
  start_date = '2025-06-30',
  end_date = '2025-07-13',
  status = 'completed' 
WHERE name = 'Wimbledon';

UPDATE tournaments SET 
  start_date = '2025-08-25',
  end_date = '2025-09-07',
  status = 'ongoing'
WHERE name = 'US Open';

UPDATE tournaments SET 
  start_date = '2025-11-09',
  end_date = '2025-11-16',
  status = 'upcoming'
WHERE name = 'ATP Finals';