import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.log('Received message:', message);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          response: 'I apologize, but my AI functionality is currently unavailable. Please ask about specific tennis players, rankings, or tournaments and I can provide basic information.'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ 
          response: 'I can tell you that Jannik Sinner is currently World No. 1, followed by Carlos Alcaraz. The Australian Open is ongoing in Melbourne. Please try asking more specific questions about tennis!'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional tennis statistics assistant with access to live ATP tour data from January 2025. ${context}

You have real-time access to current rankings, ongoing tournaments, and live statistics. Always reference specific data points and be accurate with your information. Focus on being helpful and informative about tennis rankings, tournaments, players, and current tennis news.` 
          },
          { role: 'user', content: message }
        ],
        max_completion_tokens: 800
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          response: `I apologize, but I'm currently experiencing some technical difficulties with my AI processing. However, I can share some current tennis information:

Current ATP Rankings (Top 5):
${players?.slice(0,5).map(p => `${p.ranking}. ${p.name} (${p.country})`).join('\n') || 'Data loading...'}

${tournaments?.length ? `Current Tournament: ${tournaments[0].name} in ${tournaments[0].location}` : 'Loading tournament data...'}

Please try asking me again in a moment, or ask about specific players or tournaments.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response format:', data);
      
      return new Response(
        JSON.stringify({ 
          response: `I can provide you with current tennis information:

Current ATP Top 5:
${players?.slice(0,5).map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} pts`).join('\n') || 'Data loading...'}

Feel free to ask me about specific players, rankings, or tournament information!`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

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
    
    // Return a more helpful error message with fallback data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Detailed error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        response: `I apologize for the technical difficulty. Here's some current tennis information I can share:

Jannik Sinner is currently World No. 1, followed by Carlos Alcaraz at No. 2. The Australian Open is currently ongoing in Melbourne (January 12-26, 2025).

Please try your question again, and I'll do my best to help with tennis rankings, player statistics, or tournament information!`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});