import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TournamentSchedule = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date');
      
      if (data) {
        setTournaments(data);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();

    // Set up real-time subscription
    const channel = supabase
      .channel('tournaments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          fetchTournaments();
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
        return <Badge className="bg-red-500 hover:bg-red-600">Live</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-primary">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSurfaceColor = (surface: string) => {
    switch (surface) {
      case "Hard":
        return "text-blue-600";
      case "Clay":
        return "text-orange-600";
      case "Grass":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', {...options, year: 'numeric'})} - ${end.toLocaleDateString('en-US', {...options, year: 'numeric'})}`;
    }
    
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', {...options, year: 'numeric'})}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading tournaments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Tournament Schedule</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{tournament.name}</h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateRange(tournament.start_date, tournament.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${getSurfaceColor(tournament.surface)}`}>
                      {tournament.surface} Court
                    </span>
                    {tournament.prize_money && (
                      <span className="text-muted-foreground">
                        Prize: ${(tournament.prize_money / 1000000).toFixed(1)}M
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentSchedule;