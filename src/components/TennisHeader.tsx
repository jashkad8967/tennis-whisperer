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
        </div>
      </div>
    </header>
  );
};

export default TennisHeader;