import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Player {
  name: string;
  country: string;
  ranking: number;
  points: number;
  ranking_change: number;
}

interface Tournament {
  name: string;
  location: string;
  surface: string;
  category: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_money: number;
}

interface Match {
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  round: string;
  status: string;
  score: string;
  match_date: string;
}

// Fetch ATP rankings from ATP official website
async function fetchATPRankings(): Promise<Player[]> {
  try {
    console.log('Fetching ATP rankings from ATP official website...');
    
    const response = await fetch('https://www.atptour.com/en/rankings/singles', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const players: Player[] = [];

    // Extract the actual table rows from the ATP rankings page
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const rows = html.match(tableRowRegex);
    
    if (rows) {
      let currentRank = 1;
      
      for (const row of rows) {
        try {
          // Skip header rows and empty rows
          if (row.includes('<th') || !row.includes('href=') || !row.includes('players')) continue;
          
          // Extract player name from ATP player links
          const nameMatch = row.match(/<a[^>]*href="[^"]*\/players\/[^"]*"[^>]*>([^<]+)<\/a>/);
          if (!nameMatch) continue;
          
          const playerName = nameMatch[1].trim();
          if (!playerName || playerName.length < 2) continue;
          
          // Extract points from bracketed format [11,480]
          const pointsMatch = row.match(/\[([0-9,]+)\]/);
          const points = pointsMatch ? parseInt(pointsMatch[1].replace(/,/g, '')) : 0;
          
          // Extract country code from flag images
          let country = 'N/A';
          const countryMatch = row.match(/flags\/([A-Z]{2,3})\.png/i);
          if (countryMatch) {
            country = countryMatch[1].toUpperCase();
          }
          
          // Extract ranking change if available (look for +/- patterns)
          let rankingChange = 0;
          const changeMatch = row.match(/([+-]?\d+)<br>/);
          if (changeMatch && changeMatch[1] !== '0') {
            rankingChange = parseInt(changeMatch[1]);
          }
          
          // Only add valid players with proper data
          if (playerName && points > 0 && currentRank <= 100) {
            players.push({
              name: playerName,
              country: country,
              ranking: currentRank,
              points: points,
              ranking_change: rankingChange
            });
            currentRank++;
          }
          
          if (players.length >= 100) break;
        } catch (error) {
          console.log('Error parsing row:', error);
          continue;
        }
      }
    }
    
    console.log(`Successfully scraped ${players.length} players from ATP website`);
    console.log('Top 5 players:', players.slice(0, 5).map(p => `${p.ranking}. ${p.name} (${p.points} pts)`));
    return players;

  } catch (error) {
    console.error('Error fetching ATP rankings:', error);
    return [];
  }
}


// Fetch tournaments from free tennis data sources
async function fetchTournaments(): Promise<Tournament[]> {
  try {
    console.log('Fetching tournaments from free tennis data sources...');
    
    // Try Tennis Abstract first (free, no API key needed)
    try {
      const response = await fetch('https://www.tennisabstract.com/cgi-bin/tournaments.cgi', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const tournaments: Tournament[] = [];

        // Parse Tennis Abstract tournaments
        const tournamentPattern = /<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;
        let match;

        while ((match = tournamentPattern.exec(html)) !== null && tournaments.length < 50) {
          const name = match[1].trim();
          const location = match[2].trim();
          const surface = match[3].trim();
          const status = match[4].trim();

          if (name && name !== 'Tournament' && name.length > 3) {
            // Determine tournament category based on name
            let category = 'ATP 250';
            if (name.includes('Open') || name.includes('Championships')) {
              category = 'Grand Slam';
            } else if (name.includes('Masters') || name.includes('1000')) {
              category = 'ATP 1000';
            } else if (name.includes('500')) {
              category = 'ATP 500';
            } else if (name.includes('Finals')) {
              category = 'ATP Finals';
            }

            tournaments.push({
              name: name,
              location: location || 'Unknown',
              surface: surface || 'Hard',
              category: category,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: status === 'Completed' ? 'completed' : 'ongoing',
              prize_money: 0
            });
          }
        }

        if (tournaments.length > 0) {
          console.log(`Successfully fetched ${tournaments.length} tournaments from Tennis Abstract`);
          return tournaments;
        }
      }
    } catch (error) {
      console.log('Tennis Abstract failed, trying ATP website...');
    }

    // Fallback to ATP website
    return await fetchTournamentsFallback();

  } catch (error) {
    console.error('Error fetching from free tennis sources:', error);
    return await fetchTournamentsFallback();
  }
}

// Fallback method using ATP website
async function fetchTournamentsFallback(): Promise<Tournament[]> {
  try {
    console.log('Fetching tournaments from ATP website (fallback)...');
    
    const response = await fetch('https://www.atptour.com/en/tournaments', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const tournaments: Tournament[] = [];

    // Parse tournament data using regex patterns
    const tournamentPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\|\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\|\s*(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Z][a-z]+),\s*(\d{4})/gi;
    let match;

    while ((match = tournamentPattern.exec(html)) !== null && tournaments.length < 50) {
      const name = match[1].trim();
      const location = match[2].trim();
      const day1 = parseInt(match[3]);
      const day2 = parseInt(match[4]);
      const month = match[5];
      const year = parseInt(match[6]);

      const monthMap: { [key: string]: number } = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };

      const monthNum = monthMap[month];
      if (monthNum !== undefined) {
        const startDate = new Date(year, monthNum, day1);
        const endDate = new Date(year, monthNum, day2);

        let category = 'ATP 250';
        if (name.includes('Open') || name.includes('Championships')) category = 'Grand Slam';
        else if (name.includes('Masters') || name.includes('1000')) category = 'ATP 1000';
        else if (name.includes('500')) category = 'ATP 500';
        else if (name.includes('Finals')) category = 'ATP Finals';

        let status = 'upcoming';
        const now = new Date();
        if (startDate <= now && endDate >= now) status = 'ongoing';
        else if (endDate < now) status = 'completed';

        tournaments.push({
          name: name,
          location: location,
          surface: 'Hard',
          category: category,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: status,
          prize_money: 0
        });
      }
    }

    console.log(`Successfully scraped ${tournaments.length} tournaments from ATP website`);
    return tournaments;

  } catch (error) {
    console.error('Error in fallback tournaments fetch:', error);
    return [];
  }
}

// Fetch live matches from free tennis data sources
async function fetchLiveMatches(): Promise<Match[]> {
  try {
    console.log('Fetching live matches from free tennis data sources...');
    
    // Try Tennis Abstract first (free, no API key needed)
    try {
      const response = await fetch('https://www.tennisabstract.com/cgi-bin/scores.cgi', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const matches: Match[] = [];

        // Parse Tennis Abstract live scores
        const matchPattern = /<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;
        let match;

        while ((match = matchPattern.exec(html)) !== null && matches.length < 20) {
          const player1 = match[1].trim();
          const player2 = match[2].trim();
          const score = match[3].trim();
          const status = match[4].trim();

          if (player1 && player2 && player1 !== 'Player 1' && player2 !== 'Player 2') {
            matches.push({
              tournament_id: '',
              player1_id: '',
              player2_id: '',
              round: 'Live',
              status: 'live',
              score: `${player1} vs ${player2}: ${score}`,
              match_date: new Date().toISOString()
            });
          }
        }

        if (matches.length > 0) {
          console.log(`Successfully fetched ${matches.length} live matches from Tennis Abstract`);
          return matches;
        }
      }
    } catch (error) {
      console.log('Tennis Abstract failed, trying ATP website...');
    }

    // Fallback to ATP website
    return await fetchLiveMatchesFallback();

  } catch (error) {
    console.error('Error fetching from free tennis sources:', error);
    return await fetchLiveMatchesFallback();
  }
}

// Fallback method using ATP website
async function fetchLiveMatchesFallback(): Promise<Match[]> {
  try {
    console.log('Fetching live matches from ATP website (fallback)...');
    
    const response = await fetch('https://www.atptour.com/en/scores', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const matches: Match[] = [];

    // Parse live match data using regex patterns
    const playerScorePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+vs\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    let match;

    while ((match = playerScorePattern.exec(html)) !== null && matches.length < 20) {
      const player1 = match[1].trim();
      const player2 = match[2].trim();

      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(html.length, match.index + 200);
      const context = html.substring(contextStart, contextEnd);

      const scoreMatch = context.match(/(\d+)-(\d+)/);
      const score = scoreMatch ? `${scoreMatch[1]}-${scoreMatch[2]}` : '0-0';

      if (score !== '0-0') {
        matches.push({
          tournament_id: '',
          player1_id: '',
          player2_id: '',
          round: 'Live',
          status: 'live',
          score: `${player1} vs ${player2}: ${score}`,
          match_date: new Date().toISOString()
        });
      }
    }

    console.log(`Successfully scraped ${matches.length} live matches from ATP website`);
    return matches;

  } catch (error) {
    console.error('Error in fallback live matches fetch:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting tennis data fetch...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch fresh data using 3rd party API with fallbacks
    console.log('Fetching fresh tennis data...');
    const [players, tournaments, matches] = await Promise.all([
      fetchATPRankings(),
      fetchTournaments(),
      fetchLiveMatches()
    ]);

    console.log(`Fetched ${players.length} players, ${tournaments.length} tournaments, and ${matches.length} matches`);

    // Update database with fetched data
    if (players.length > 0) {
      console.log('Updating players in database...');
      
      await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: playersError } = await supabase.from('players').insert(players);
      if (playersError) {
        console.error('Error inserting players:', playersError);
      } else {
        console.log(`Successfully inserted ${players.length} players`);
      }
    }

    if (tournaments.length > 0) {
      console.log('Updating tournaments in database...');
      
      await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: tournamentsError } = await supabase.from('tournaments').insert(tournaments);
      if (tournamentsError) {
        console.error('Error inserting tournaments:', tournamentsError);
      } else {
        console.log(`Successfully inserted ${tournaments.length} tournaments`);
      }
    }

    if (matches.length > 0) {
      console.log('Updating live matches...');
      
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: matchesError } = await supabase.from('matches').insert(matches);
      if (matchesError) {
        console.error('Error inserting matches:', matchesError);
      } else {
        console.log(`Successfully inserted ${matches.length} live matches`);
      }
    }

    // Update statistics
    console.log('Updating statistics...');
    const stats = {
      active_players: players.length,
      matches_today: matches.filter(m => m.status === 'live').length,
      ranking_updates: players.filter(p => p.ranking_change !== 0).length,
      live_tournaments: tournaments.filter(t => t.status === 'ongoing').length
    };

    await supabase.from('statistics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: statsError } = await supabase.from('statistics').insert([stats]);
    if (statsError) {
      console.error('Error inserting statistics:', statsError);
    } else {
      console.log('Successfully updated statistics');
    }

    console.log('Tennis data fetch completed successfully');

    return new Response(JSON.stringify({
      success: true, 
      message: 'Tennis data updated successfully',
      data: {
        players: players.length,
        tournaments: tournaments.length,
        matches: matches.length,
        stats: stats
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fetch-tennis-data function:', error);
    
    return new Response(JSON.stringify({
      success: false, 
      error: error.message,
      message: 'Failed to update tennis data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});