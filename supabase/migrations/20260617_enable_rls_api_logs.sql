-- Enable RLS on api_logs table
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read api logs
-- (writes are done via supabaseAdmin service role which bypasses RLS)
CREATE POLICY "Authenticated users can read api_logs" ON api_logs
  FOR SELECT
  TO authenticated
  USING (true);
