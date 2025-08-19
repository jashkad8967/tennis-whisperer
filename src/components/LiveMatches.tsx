import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Match {
  id: string;
  tournament: {
    name: string;
    surface: string;
  };
  round: string;
  player1: {
    name: string;
    ranking: number;
  };
  player2: {
    name: string;
    ranking: number;
  };
  status: string;
  score: string;
  match_date: string;
}

const LiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveMatches = async () => {
    try {
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          round,
          status,
          score,
          match_date,
          tournaments!tournament_id (
            name,
            surface
          ),
          player1:players!player1_id (
            name,
            ranking
          ),
          player2:players!player2_id (
            name,
            ranking
          )
        `)
        .eq('status', 'live')
        .order('match_date', { ascending: false });
      
      if (data) {
        const formattedMatches = data.map((match: any) => ({
          id: match.id,
          tournament: match.tournaments || { name: 'Unknown Tournament', surface: 'Hard' },
          round: match.round,
          player1: match.player1 || { name: 'Player 1', ranking: 0 },
          player2: match.player2 || { name: 'Player 2', ranking: 0 },
          status: match.status,
          score: match.score || '',
          match_date: match.match_date
        }));
        setMatches(formattedMatches);
      }
    } catch (error) {
      console.error('Error fetching live matches:', error);
      // Fallback to sample data if no real matches available
      setMatches([
        {
          id: '1',
          tournament: { name: 'ATP Masters', surface: 'Hard' },
          round: 'Quarter Final',
          player1: { name: 'Sample Player 1', ranking: 10 },
          player2: { name: 'Sample Player 2', ranking: 15 },
          status: 'live',
          score: '6-3, 4-6, 2-1',
          match_date: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMatches();

    // Set up real-time subscription for live matches
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          fetchLiveMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>;
      case "match_point":
        return <Badge className="bg-red-500 hover:bg-red-600">Match Point</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const parseScore = (score: string) => {
    if (!score) return { sets: [], currentGames: null };
    
    // Parse score like "6-3, 4-6, 2-1" 
    const sets = score.split(',').map(set => set.trim().split('-'));
    const completedSets = sets.slice(0, -1);
    const currentSet = sets[sets.length - 1];
    
    return {
      sets: completedSets,
      currentGames: score.includes(',') ? currentSet : null
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>Live Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading live matches...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5" />
          <span>Live Matches</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No live matches at the moment
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const scoreData = parseScore(match.score);
              
              return (
                <div key={match.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{match.tournament.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {match.round} • {match.tournament.surface}
                      </p>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Player 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">
                          #{match.player1.ranking || 'NR'}
                        </span>
                        <span className="font-medium">{match.player1.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {scoreData.sets.map((set, setIndex) => (
                          <span key={setIndex} className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded text-sm font-mono">
                            {set[0]}
                          </span>
                        ))}
                        {scoreData.currentGames && (
                          <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded text-sm font-mono">
                            {scoreData.currentGames[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Player 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">
                          #{match.player2.ranking || 'NR'}
                        </span>
                        <span className="font-medium">{match.player2.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {scoreData.sets.map((set, setIndex) => (
                          <span key={setIndex} className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded text-sm font-mono">
                            {set[1]}
                          </span>
                        ))}
                        {scoreData.currentGames && (
                          <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded text-sm font-mono">
                            {scoreData.currentGames[1]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {match.score ? `Set ${scoreData.sets.length + 1}` : 'Starting soon'}
                      </span>
                    </div>
                    <span className="text-sm text-primary">
                      Live Match
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveMatches;