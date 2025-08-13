import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const PlayerRankings = () => {
  const players = [
    { rank: 1, name: "Novak Djokovic", country: "Serbia", points: "9,945", change: 0, trend: "same" },
    { rank: 2, name: "Carlos Alcaraz", country: "Spain", points: "8,815", change: 0, trend: "same" },
    { rank: 3, name: "Daniil Medvedev", country: "Russia", points: "7,950", change: 1, trend: "up" },
    { rank: 4, name: "Jannik Sinner", country: "Italy", points: "7,260", change: -1, trend: "down" },
    { rank: 5, name: "Andrey Rublev", country: "Russia", points: "4,980", change: 0, trend: "same" },
    { rank: 6, name: "Stefanos Tsitsipas", country: "Greece", points: "4,785", change: 2, trend: "up" },
    { rank: 7, name: "Alexander Zverev", country: "Germany", points: "4,615", change: -1, trend: "down" },
    { rank: 8, name: "Holger Rune", country: "Denmark", points: "4,375", change: 1, trend: "up" },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>ATP Rankings - Men's Singles</span>
          <Badge variant="secondary">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.rank}>
                <TableCell className="font-medium">#{player.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell>{player.country}</TableCell>
                <TableCell className="font-mono">{player.points}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(player.trend)}
                    <span className={player.change > 0 ? "text-green-500" : player.change < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {player.change > 0 ? `+${player.change}` : player.change === 0 ? "-" : player.change}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlayerRankings;