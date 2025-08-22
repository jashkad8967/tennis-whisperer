import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
Current ATP Tennis Data (as of latest update):

Top Players Rankings:
${players?.slice(0,15).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} points${p.ranking_change !== 0 ? ` (${p.ranking_change > 0 ? '+' : ''}${p.ranking_change})` : ''}`).join('\n') || 'Player data currently updating...'}

Current Tournaments:
${tournaments?.map(t => `${t.name} (${t.location}) - ${t.status} - ${t.surface} - ${t.category} - Prize: $${t.prize_money?.toLocaleString()}`).join('\n') || 'Tournament data currently updating...'}

Live Matches:
${matches?.map(m => `${m.player1?.name} vs ${m.player2?.name} - ${m.tournaments?.name} (${m.round}) - Score: ${m.score || 'Starting soon'}`).join('\n') || 'No live matches currently'}

Tennis Statistics:
- Active Players: ${stats?.[0]?.active_players || 'Updating...'}  
- Live Matches: ${stats?.[0]?.matches_today || 'Updating...'}
- Live Tournaments: ${stats?.[0]?.live_tournaments || 'Updating...'}
- Recent Ranking Changes: ${stats?.[0]?.ranking_updates || 'Updating...'}
`;

    // Get conversation history from database for persistence
    const sessionId = conversationId || 'default';
    let conversationHistory = [];
    
    try {
      // Try to get existing conversation history
      const { data: historyData } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (historyData) {
        conversationHistory = historyData.map(h => ({
          role: h.role,
          content: h.content
        }));
      }
    } catch (historyError) {
      console.log('No conversation history table found, starting fresh conversation');
    }
    
    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });
    
    // Keep only last 10 messages to prevent token limit issues
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    console.log('Making OpenAI API request with conversation history...');
    
    // Create dynamic system prompt based on current data
    const systemPrompt = `You are a knowledgeable tennis expert and coach with access to real-time ATP Tour data. You maintain conversation context and can discuss tennis topics in depth. 

IMPORTANT: Use the provided current tennis data to answer questions accurately. Be conversational, engaging, and provide specific insights about players, rankings, tournaments, and matches when available.

Key Guidelines:
- Reference specific current data when relevant
- Maintain conversation context from previous messages
- Be personable and engaging like a tennis coach
- Provide analysis and insights, not just facts
- Ask follow-up questions to keep the conversation going
- If the user asks about specific players or tournaments, use the current data provided
- If data is "updating" or unavailable, acknowledge that and offer to help with general tennis knowledge

Current conversation context: ${conversationHistory.length > 1 ? 'This is an ongoing conversation. Maintain context from previous messages.' : 'This is a new conversation.'}`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Current Tennis Data:\n${context}\n\nPlease use this data to inform your responses.`
          },
          ...conversationHistory
        ],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Generate dynamic fallback response based on current data
      const topPlayers = players?.slice(0, 5) || [];
      const liveTournaments = tournaments?.filter(t => t.status === 'ongoing') || [];
      
      let fallbackResponse = `I'm experiencing some technical difficulties with my AI brain, but I can still help you with tennis information! `;
      
      if (topPlayers.length > 0) {
        fallbackResponse += `\n\n📊 Current Top 5 Players:\n${topPlayers.map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} pts`).join('\n')}`;
      }
      
      if (liveTournaments.length > 0) {
        fallbackResponse += `\n\n🎾 Live Tournaments:\n${liveTournaments.map(t => `• ${t.name} (${t.location})`).join('\n')}`;
      }
      
      fallbackResponse += `\n\nWhat would you like to know about tennis? I'm here to help!`;
      
      return new Response(JSON.stringify({
        response: fallbackResponse
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add AI response to conversation history
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    
    // Try to save conversation history to database for persistence
    try {
      // Save user message
      await supabase.from('conversation_history').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      });
      
      // Save AI response
      await supabase.from('conversation_history').insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      });
    } catch (saveError) {
      console.log('Could not save conversation history:', saveError);
    }
    
    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in tennis-chatbot function:', error);
    
    // Generate different error responses to avoid repetition
    const errorResponses = [
      "I'm having a bit of a technical moment, but I'm still your tennis expert! What would you like to know about the current ATP Tour?",
      "Oops, my tennis brain is a bit fuzzy right now. Let me help you with tennis knowledge - what's on your mind?",
      "I'm experiencing some connectivity issues, but I'm here to chat tennis! What would you like to discuss about current players or tournaments?",
      "My AI is taking a quick break, but I'm still ready to talk tennis! What would you like to know about the current ATP season?"
    ];
    
    const randomResponse = errorResponses[Math.floor(Math.random() * errorResponses.length)];
    
    return new Response(JSON.stringify({
      response: randomResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});