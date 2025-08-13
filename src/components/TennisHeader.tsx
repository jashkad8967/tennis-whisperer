import { Trophy, TrendingUp, Calendar, MessageCircle } from "lucide-react";

const TennisHeader = () => {
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
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Live Rankings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Tournaments</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TennisHeader;