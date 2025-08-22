-- Create conversation_history table for chatbot persistence
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by session_id
CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id ON conversation_history(session_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at);

-- Add RLS policies if needed
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on conversation_history" ON conversation_history
  FOR ALL USING (true); 