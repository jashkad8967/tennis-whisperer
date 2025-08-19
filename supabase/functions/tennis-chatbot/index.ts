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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current tennis data for context
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('ranking')
      .limit(10);

    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date');

    const { data: stats } = await supabase
      .from('statistics')
      .select('*')
      .limit(1);

    // Build context for AI
    const context = `
Current ATP Tennis Data:

Top 10 Players:
${players?.map(p => `${p.ranking}. ${p.name} (${p.country}) - ${p.points} points`).join('\n') || 'No player data available'}

Recent Tournaments:
${tournaments?.map(t => `${t.name} (${t.location}) - ${t.status} - ${t.surface} court`).join('\n') || 'No tournament data available'}

Current Statistics:
- Active Players: ${stats?.[0]?.active_players || 'N/A'}
- Matches Today: ${stats?.[0]?.matches_today || 'N/A'}
- Live Tournaments: ${stats?.[0]?.live_tournaments || 'N/A'}

Please answer the user's question about tennis using this current data.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a tennis statistics assistant with access to current ATP tour data. Use the provided data to answer questions about tennis rankings, tournaments, and statistics. Be informative and engaging. ${context}` 
          },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});