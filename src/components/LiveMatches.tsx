import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play } from "lucide-react";

const LiveMatches = () => {
  const liveMatches = [
    {
      tournament: "Indian Wells Masters",
      round: "Quarter Final",
      player1: { name: "Carlos Alcaraz", rank: 2, sets: [6, 4], games: 2 },
      player2: { name: "Daniil Medvedev", rank: 3, sets: [3, 6], games: 1 },
      currentSet: 3,
      status: "In Progress",
      surface: "Hard"
    },
    {
      tournament: "Indian Wells Masters",
      round: "Quarter Final",
      player1: { name: "Jannik Sinner", rank: 4, sets: [7, 6], games: 0 },
      player2: { name: "Alexander Zverev", rank: 7, sets: [6, 3], games: 0 },
      currentSet: 2,
      status: "Match Point",
      surface: "Hard"
    },
    {
      tournament: "Miami Open",
      round: "Round of 16",
      player1: { name: "Stefanos Tsitsipas", rank: 6, sets: [2], games: 3 },
      player2: { name: "Holger Rune", rank: 8, sets: [6], games: 5 },
      currentSet: 2,
      status: "In Progress",
      surface: "Hard"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Progress":
        return <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>;
      case "Match Point":
        return <Badge className="bg-red-500 hover:bg-red-600">Match Point</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5" />
          <span>Live Matches</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {liveMatches.map((match, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{match.tournament}</h3>
                  <p className="text-sm text-muted-foreground">{match.round} • {match.surface}</p>
                </div>
                {getStatusBadge(match.status)}
              </div>
              
              <div className="space-y-3">
                {/* Player 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">#{match.player1.rank}</span>
                    <span className="font-medium">{match.player1.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {match.player1.sets.map((set, setIndex) => (
                      <span key={setIndex} className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded text-sm font-mono">
                        {set}
                      </span>
                    ))}
                    {match.status === "In Progress" && (
                      <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded text-sm font-mono">
                        {match.player1.games}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Player 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">#{match.player2.rank}</span>
                    <span className="font-medium">{match.player2.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {match.player2.sets.map((set, setIndex) => (
                      <span key={setIndex} className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded text-sm font-mono">
                        {set}
                      </span>
                    ))}
                    {match.status === "In Progress" && (
                      <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded text-sm font-mono">
                        {match.player2.games}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Set {match.currentSet}</span>
                </div>
                <button className="text-sm text-primary hover:underline">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMatches;