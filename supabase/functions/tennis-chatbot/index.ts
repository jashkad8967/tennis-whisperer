import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store conversation history in memory (in production, you'd use a database)
const conversationHistory = new Map();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received message:', message);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current tennis data for context
    console.log('Fetching tennis data...');
    
    const [playersResponse, tournamentsResponse, matchesResponse, statsResponse] = await Promise.all([
      supabase.from('players').select('*').order('ranking').limit(20),
      supabase.from('tournaments').select('*').order('start_date').limit(10),
      supabase.from('matches').select(`
        id, round, status, score, match_date,
        tournaments!tournament_id(name, surface),
        player1:players!player1_id(name, ranking),
        player2:players!player2_id(name, ranking)
      `).eq('status', 'live').limit(5),
      supabase.from('statistics').select('*').limit(1)
    ]);

    const { data: players } = playersResponse;
    const { data: tournaments } = tournamentsResponse;
    const { data: matches } = matchesResponse;
    const { data: stats } = statsResponse;

    // Build comprehensive context with all current tennis data
    const context = `
Current ATP Tennis Data (January 2025):

Top Players Rankings:
${players?.slice(0,15).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} points${p.ranking_change !== 0 ? ` (${p.ranking_change > 0 ? '+' : ''}${p.ranking_change})` : ''}`).join('\n') || 'Loading player data...'}

Current Tournaments:
${tournaments?.map(t => `${t.name} (${t.location}) - ${t.status} - ${t.surface} - ${t.category} - Prize: $${t.prize_money?.toLocaleString()}`).join('\n') || 'Loading tournament data...'}

Live Matches:
${matches?.map(m => `${m.player1?.name} vs ${m.player2?.name} - ${m.tournaments?.name} (${m.round}) - Score: ${m.score || 'Starting soon'}`).join('\n') || 'No live matches currently'}

Tennis Statistics:
- Active Players: ${stats?.[0]?.active_players || 'N/A'}  
- Live Matches: ${stats?.[0]?.matches_today || 'N/A'}
- Live Tournaments: ${stats?.[0]?.live_tournaments || 'N/A'}
- Recent Ranking Changes: ${stats?.[0]?.ranking_updates || 'N/A'}
`;

    // Get or create conversation history
    const sessionId = conversationId || 'default';
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    
    const history = conversationHistory.get(sessionId);
    
    // Add user message to history
    history.push({ role: 'user', content: message });
    
    // Keep only last 10 messages to prevent token limit issues
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    console.log('Making OpenAI API request with conversation history...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable tennis expert and coach with access to real-time ATP Tour data. You maintain conversation context and can discuss tennis topics in depth. Use the provided current tennis data to answer questions accurately. Be conversational, engaging, and provide specific insights about players, rankings, tournaments, and matches when available.

Key Guidelines:
- Reference specific current data when relevant
- Maintain conversation context from previous messages
- Be personable and engaging like a tennis coach
- Provide analysis and insights, not just facts
- Ask follow-up questions to keep the conversation going`
          },
          {
            role: 'user',
            content: `Current Tennis Data:\n${context}\n\nPlease use this data to inform your responses.`
          },
          ...history
        ],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Return fallback response with current data
      return new Response(JSON.stringify({
        response: `I can help you with tennis information! Here's what's happening right now:

📊 Current Top 5 Players:
${players?.slice(0,5).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} pts`).join('\n') || 'Loading...'}

${tournaments?.filter(t => t.status === 'ongoing').length > 0 ? 
`🎾 Live Tournaments:
${tournaments.filter(t => t.status === 'ongoing').map(t => `• ${t.name} (${t.location})`).join('\n')}` : 
'No tournaments currently live'}

What would you like to know about tennis?`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add AI response to conversation history
    history.push({ role: 'assistant', content: aiResponse });
    
    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in tennis-chatbot function:', error);
    
    return new Response(JSON.stringify({
      response: 'I apologize for the technical difficulty. Let me try to help you with tennis information. What would you like to know about current players or tournaments?'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});