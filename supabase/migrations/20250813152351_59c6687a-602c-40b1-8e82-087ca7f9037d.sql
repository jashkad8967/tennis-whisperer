-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  ranking INTEGER,
  points INTEGER DEFAULT 0,
  ranking_change INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  surface TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize_money INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id),
  player1_id UUID REFERENCES public.players(id),
  player2_id UUID REFERENCES public.players(id),
  match_date TIMESTAMP WITH TIME ZONE,
  round TEXT NOT NULL,
  score TEXT,
  winner_id UUID REFERENCES public.players(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create statistics table
CREATE TABLE public.statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  active_players INTEGER DEFAULT 0,
  live_tournaments INTEGER DEFAULT 0,
  matches_today INTEGER DEFAULT 0,
  ranking_updates INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (tennis data is public)
CREATE POLICY "Public read access on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public read access on tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public read access on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read access on statistics" ON public.statistics FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial statistics record
INSERT INTO public.statistics (active_players, live_tournaments, matches_today, ranking_updates) 
VALUES (2847, 23, 156, 1234);

-- Insert sample players data
INSERT INTO public.players (name, country, ranking, points, ranking_change) VALUES
('Novak Djokovic', 'Serbia', 1, 9945, 0),
('Carlos Alcaraz', 'Spain', 2, 8815, 0),
('Daniil Medvedev', 'Russia', 3, 7950, 1),
('Jannik Sinner', 'Italy', 4, 7260, -1),
('Andrey Rublev', 'Russia', 5, 4980, 0),
('Stefanos Tsitsipas', 'Greece', 6, 4785, 2),
('Alexander Zverev', 'Germany', 7, 4615, -1),
('Holger Rune', 'Denmark', 8, 4375, 1);

-- Insert sample tournaments data
INSERT INTO public.tournaments (name, location, surface, start_date, end_date, prize_money, status, category) VALUES
('Australian Open', 'Melbourne, Australia', 'Hard', '2024-01-15', '2024-01-28', 75000000, 'completed', 'Grand Slam'),
('Roland Garros', 'Paris, France', 'Clay', '2024-05-26', '2024-06-09', 53478000, 'completed', 'Grand Slam'),
('Wimbledon', 'London, England', 'Grass', '2024-07-01', '2024-07-14', 50000000, 'completed', 'Grand Slam'),
('US Open', 'New York, USA', 'Hard', '2024-08-26', '2024-09-08', 65000000, 'ongoing', 'Grand Slam'),
('ATP Finals', 'Turin, Italy', 'Hard', '2024-11-10', '2024-11-17', 15000000, 'upcoming', 'Masters Cup');

-- Insert sample matches data
INSERT INTO public.matches (tournament_id, player1_id, player2_id, match_date, round, score, winner_id, status) VALUES
((SELECT id FROM public.tournaments WHERE name = 'US Open'), 
 (SELECT id FROM public.players WHERE name = 'Novak Djokovic'), 
 (SELECT id FROM public.players WHERE name = 'Carlos Alcaraz'), 
 '2024-08-15 14:00:00+00', 'Quarterfinal', '6-4, 6-2, 6-3', 
 (SELECT id FROM public.players WHERE name = 'Novak Djokovic'), 'completed'),
((SELECT id FROM public.tournaments WHERE name = 'US Open'), 
 (SELECT id FROM public.players WHERE name = 'Daniil Medvedev'), 
 (SELECT id FROM public.players WHERE name = 'Jannik Sinner'), 
 '2024-08-15 19:00:00+00', 'Semifinal', '', NULL, 'live'),
((SELECT id FROM public.tournaments WHERE name = 'ATP Finals'), 
 (SELECT id FROM public.players WHERE name = 'Stefanos Tsitsipas'), 
 (SELECT id FROM public.players WHERE name = 'Alexander Zverev'), 
 '2024-11-12 15:00:00+00', 'Round Robin', '', NULL, 'scheduled');