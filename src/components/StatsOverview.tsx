import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const StatsOverview = () => {
  const [stats, setStats] = useState({
    active_players: 0,
    matches_today: 0,
    ranking_updates: 0,
    live_tournaments: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const { data } = await supabase
        .from('statistics')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tennis-data');
      
      if (error) throw error;
      
      await fetchStats();
      toast({
        title: "Success",
        description: "Tennis data updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tennis data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsData = [
    {
      title: "Active Players",
      value: stats.active_players.toLocaleString(),
      change: "Currently tracked",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Live Tournaments",
      value: stats.live_tournaments.toString(),
      change: "Currently active",
      icon: Trophy,
      color: "text-chart-2"
    },
    {
      title: "Matches Today",
      value: stats.matches_today.toString(),
      change: "Scheduled matches",
      icon: Calendar,
      color: "text-chart-3"
    },
    {
      title: "Ranking Updates",
      value: stats.ranking_updates.toString(),
      change: "Recent changes",
      icon: TrendingUp,
      color: "text-chart-4"
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tennis Statistics Overview</h2>
        <Button 
          onClick={updateData} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Update Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
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
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;