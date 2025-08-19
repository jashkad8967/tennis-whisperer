-- Add foreign key constraints to matches table
ALTER TABLE public.matches 
ADD CONSTRAINT matches_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id);

ALTER TABLE public.matches 
ADD CONSTRAINT matches_player1_id_fkey 
FOREIGN KEY (player1_id) REFERENCES public.players(id);

ALTER TABLE public.matches 
ADD CONSTRAINT matches_player2_id_fkey 
FOREIGN KEY (player2_id) REFERENCES public.players(id);

ALTER TABLE public.matches 
ADD CONSTRAINT matches_winner_id_fkey 
FOREIGN KEY (winner_id) REFERENCES public.players(id);

-- Insert some sample live matches
INSERT INTO public.matches (tournament_id, player1_id, player2_id, round, status, score, match_date) 
SELECT 
  t.id as tournament_id,
  p1.id as player1_id,
  p2.id as player2_id,
  'Quarter Final',
  'live',
  '6-3, 4-6, 2-1',
  NOW()
FROM public.tournaments t, public.players p1, public.players p2
WHERE t.name = 'Indian Wells Masters' 
  AND p1.name = 'Carlos Alcaraz' 
  AND p2.name = 'Daniil Medvedev'
LIMIT 1;

INSERT INTO public.matches (tournament_id, player1_id, player2_id, round, status, score, match_date) 
SELECT 
  t.id as tournament_id,
  p1.id as player1_id,
  p2.id as player2_id,
  'Quarter Final',
  'live',
  '7-6, 6-3',
  NOW()
FROM public.tournaments t, public.players p1, public.players p2
WHERE t.name = 'Indian Wells Masters' 
  AND p1.name = 'Jannik Sinner' 
  AND p2.name = 'Andrey Rublev'
LIMIT 1;

-- Enable realtime for matches table
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;