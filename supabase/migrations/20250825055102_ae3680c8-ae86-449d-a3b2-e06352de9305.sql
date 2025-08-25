-- Create conversation_history table for tennis chatbot
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation history (public access for now since no auth)
CREATE POLICY "Public can view all conversations" 
ON public.conversation_history 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert conversations" 
ON public.conversation_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_conversation_history_session_id ON public.conversation_history(session_id);
CREATE INDEX idx_conversation_history_created_at ON public.conversation_history(created_at);