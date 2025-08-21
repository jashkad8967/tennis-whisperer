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
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Database configuration not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current tennis data for context
    console.log('Fetching tennis data...');
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('ranking')
      .limit(10);

    if (playersError) {
      console.error('Error fetching players:', playersError);
    }

    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date');

    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError);
    }

    const { data: stats, error: statsError } = await supabase
      .from('statistics')
      .select('*')
      .limit(1);

    if (statsError) {
      console.error('Error fetching statistics:', statsError);
    }

    // Build context for AI
    const context = `
Current ATP Tennis Data (January 2025):

Top 10 Players (Live Rankings):
${players?.map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} points`).join('\n') || 'Loading player data...'}

Current Tournaments:
${tournaments?.map(t => `${t.name} (${t.location}) - ${t.status} - ${t.surface} court - Prize: $${t.prize_money?.toLocaleString()}`).join('\n') || 'Loading tournament data...'}

Live Statistics:
- Active Players: ${stats?.[0]?.active_players || 'N/A'}  
- Matches Today: ${stats?.[0]?.matches_today || 'N/A'}
- Live Tournaments: ${stats?.[0]?.live_tournaments || 'N/A'}

The Australian Open 2025 is currently ongoing (January 12-26) in Melbourne. Jannik Sinner is the current World No. 1.

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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
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
    
    // Return a more helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Detailed error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: 'I apologize, but I am experiencing technical difficulties. Please try again in a moment.',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});