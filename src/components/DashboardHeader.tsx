import { Trophy, TrendingUp, Calendar, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  const openATPTour = () => {
    window.open('https://www.atptour.com/en/rankings/singles/live', '_blank');
  };

  const openTournaments = () => {
    window.open('https://www.atptour.com/en/tournaments', '_blank');
  };

  const openScores = () => {
    window.open('https://www.atptour.com/en/scores/current', '_blank');
  };

  return (
    <header className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Trophy className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Tennis Analytics Hub</h1>
              <p className="text-primary-foreground/80">Real-time tennis statistics and insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Internal Navigation */}
            <div className="flex items-center space-x-6 text-sm mr-6">
              <button 
                onClick={() => document.getElementById('rankings')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 hover:text-primary-foreground/70 transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Live Rankings</span>
              </button>
              <button 
                onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 hover:text-primary-foreground/70 transition-colors cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>Tournaments</span>
              </button>
              <button 
                onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-2 hover:text-primary-foreground/70 transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>AI Assistant</span>
              </button>
            </div>

            {/* External ATP Links */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openATPTour}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                ATP Rankings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openTournaments}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Tournaments
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openScores}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Live Scores
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;