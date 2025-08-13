import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";

const TournamentSchedule = () => {
  const tournaments = [
    {
      name: "Australian Open",
      location: "Melbourne, Australia",
      date: "Jan 14-28, 2024",
      status: "completed",
      surface: "Hard",
      prize: "$86.5M"
    },
    {
      name: "Indian Wells Masters",
      location: "Indian Wells, USA",
      date: "Mar 6-17, 2024",
      status: "live",
      surface: "Hard",
      prize: "$18.8M"
    },
    {
      name: "Miami Open",
      location: "Miami, USA",
      date: "Mar 20-31, 2024",
      status: "upcoming",
      surface: "Hard",
      prize: "$18.8M"
    },
    {
      name: "Monte Carlo Masters",
      location: "Monaco",
      date: "Apr 7-14, 2024",
      status: "upcoming",
      surface: "Clay",
      prize: "$6.8M"
    },
    {
      name: "French Open",
      location: "Paris, France",
      date: "May 26 - Jun 9, 2024",
      status: "upcoming",
      surface: "Clay",
      prize: "$58.4M"
    },
    {
      name: "Wimbledon",
      location: "London, England",
      date: "Jul 1-14, 2024",
      status: "upcoming",
      surface: "Grass",
      prize: "$59.8M"
    }
  ];

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
          {tournaments.map((tournament, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
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
                      <span>{tournament.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-medium ${getSurfaceColor(tournament.surface)}`}>
                      {tournament.surface} Court
                    </span>
                    <span className="text-muted-foreground">Prize: {tournament.prize}</span>
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