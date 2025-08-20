import TennisHeader from "@/components/TennisHeader";
import StatsOverview from "@/components/StatsOverview";
import PlayerRankings from "@/components/PlayerRankings";
import TournamentSchedule from "@/components/TournamentSchedule";
import TennisChatbot from "@/components/TennisChatbot";
import LiveMatches from "@/components/LiveMatches";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TennisHeader />
      
      <main className="container mx-auto px-6 py-8">
        <StatsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2" id="rankings">
            <PlayerRankings />
          </div>
          <div id="ai-assistant">
            <TennisChatbot />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div id="tournaments">
            <TournamentSchedule />
          </div>
          <LiveMatches />
        </div>
      </main>
    </div>
  );
};

export default Index;
