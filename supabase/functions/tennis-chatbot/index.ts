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
    const { message } = await req.json();
    
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

    // Fetch current tennis data for context with error handling
    console.log('Fetching tennis data...');
    
    const [playersResponse, tournamentsResponse, statsResponse] = await Promise.all([
      supabase.from('players').select('*').order('ranking').limit(15),
      supabase.from('tournaments').select('*').order('start_date'),
      supabase.from('statistics').select('*').limit(1)
    ]);

    const { data: players, error: playersError } = playersResponse;
    const { data: tournaments, error: tournamentsError } = tournamentsResponse; 
    const { data: stats, error: statsError } = statsResponse;

    if (playersError) {
      console.error('Error fetching players:', playersError);
    }
    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError);
    }
    if (statsError) {
      console.error('Error fetching statistics:', statsError);
    }

    // Build context for AI with dynamic data
    const context = `
Current ATP Tennis Data (January 2025):

Top Players Rankings:
${players?.slice(0,10).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} points`).join('\n') || 'Loading player data...'}

Current Tournaments:
${tournaments?.slice(0,5).map(t => `${t.name} (${t.location}) - ${t.status} - ${t.surface} court - Prize: $${t.prize_money?.toLocaleString()}`).join('\n') || 'Loading tournament data...'}

Live Statistics:
- Active Players: ${stats?.[0]?.active_players || 'N/A'}  
- Matches Today: ${stats?.[0]?.matches_today || 'N/A'}
- Live Tournaments: ${stats?.[0]?.live_tournaments || 'N/A'}

Please answer the user's question about tennis using this current data. Be informative and engaging.
`;

    console.log('Making OpenAI API request...');
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
            content: `You are a knowledgeable tennis expert and coach with access to current ATP Tour data. Use the provided tennis data to answer questions accurately and engagingly. Be specific about rankings, tournaments, and match results when you have the data. If you don't have specific information about something, acknowledge it and provide general tennis knowledge instead.`
          },
          {
            role: 'user',
            content: `${context}\n\nUser Question: ${message}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Return a helpful response with available data
      return new Response(JSON.stringify({
        response: `I can tell you about current tennis rankings and tournaments based on the latest data. Here's what I know:

Top Players:
${players?.slice(0,5).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} pts`).join('\n') || 'Data loading...'}

Feel free to ask me about specific players, rankings, or tournament information!`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in tennis-chatbot function:', error);
    
    // Return a generic error message without referencing specific data
    return new Response(JSON.stringify({
      success: false,
      error: 'Service temporarily unavailable',
      message: 'I apologize, but I\'m having trouble accessing the latest tennis information right now. Please try asking your question again in a moment.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});