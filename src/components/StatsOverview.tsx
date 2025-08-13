import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Calendar, TrendingUp } from "lucide-react";

const StatsOverview = () => {
  const stats = [
    {
      title: "Active Players",
      value: "2,847",
      change: "+12.5%",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Live Tournaments",
      value: "23",
      change: "+3",
      icon: Trophy,
      color: "text-chart-2"
    },
    {
      title: "Matches Today",
      value: "156",
      change: "+8.2%",
      icon: Calendar,
      color: "text-chart-3"
    },
    {
      title: "Ranking Updates",
      value: "1,234",
      change: "+15.3%",
      icon: TrendingUp,
      color: "text-chart-4"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">{stat.change}</span> from yesterday
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;