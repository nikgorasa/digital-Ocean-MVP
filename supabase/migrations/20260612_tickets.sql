-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('flight', 'hotel', 'holiday', 'payment', 'loyalty', 'account', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'escalated', 'pending', 'resolved', 'closed')),
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  booking_ref TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Ticket notes table
CREATE TABLE IF NOT EXISTS ticket_notes (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('user', 'agent', 'system')),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket activities table
CREATE TABLE IF NOT EXISTS ticket_activities (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);

-- RLS policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets
CREATE POLICY "Users read own tickets" ON tickets
  FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

-- Users can create tickets
CREATE POLICY "Users create tickets" ON tickets
  FOR INSERT WITH CHECK (true);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users update own tickets" ON tickets
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Anyone can read notes for tickets they can see
CREATE POLICY "Read notes for visible tickets" ON ticket_notes
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE user_id = auth.uid()::text OR user_id IS NULL
    )
  );

-- Users can add notes to their tickets
CREATE POLICY "Add notes to own tickets" ON ticket_notes
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets WHERE user_id = auth.uid()::text OR user_id IS NULL
    )
  );

-- Activities are read-only for users
CREATE POLICY "Read activities for visible tickets" ON ticket_activities
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE user_id = auth.uid()::text OR user_id IS NULL
    )
  );
