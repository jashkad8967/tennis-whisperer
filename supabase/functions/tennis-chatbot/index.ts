import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationHistory {
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId } = await req.json();
    
    if (!message || !sessionId) {
      return new Response(JSON.stringify({
        error: 'Message and sessionId are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history from database
    const { data: history } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get current tennis data for context
    const { data: players } = await supabase.from('players').select('*').order('ranking').limit(10);
    const { data: tournaments } = await supabase.from('tournaments').select('*').eq('status', 'ongoing').limit(5);
    const { data: matches } = await supabase.from('matches').select('*').eq('status', 'live').limit(5);

    // Build context for ChatGPT
    let context = "You are a tennis expert assistant. Use this current tennis data to answer questions:\n\n";
    
    if (players && players.length > 0) {
      context += "Current Top 10 ATP Rankings:\n";
      players.forEach((player, index) => {
        context += `${index + 1}. ${player.name} (${player.country}) - ${player.points} points\n`;
      });
      context += "\n";
    }

    if (tournaments && tournaments.length > 0) {
      context += "Ongoing Tournaments:\n";
      tournaments.forEach(tournament => {
        context += `- ${tournament.name} in ${tournament.location} (${tournament.surface})\n`;
      });
      context += "\n";
    }

    if (matches && matches.length > 0) {
      context += "Live Matches:\n";
      matches.forEach(match => {
        context += `- ${match.score}\n`;
      });
      context += "\n";
    }

    // Prepare conversation history for ChatGPT
    const conversationHistory: ChatMessage[] = [
      { role: 'system', content: context + "Provide helpful, accurate tennis information. Be conversational and engaging." }
    ];

    // Add conversation history (last 10 messages to stay within token limits)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach(msg => {
        conversationHistory.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message
    conversationHistory.push({ role: 'user', content: message });

    // Call ChatGPT API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save user message to database
    await supabase.from('conversation_history').insert({
      session_id: sessionId,
      role: 'user',
      content: message
    });

    // Save assistant response to database
    await supabase.from('conversation_history').insert({
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage
    });

    return new Response(JSON.stringify({
      success: true,
      response: assistantMessage,
      context: {
        players: players?.length || 0,
        tournaments: tournaments?.length || 0,
        matches: matches?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in tennis chatbot:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      response: "I'm experiencing technical difficulties. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});