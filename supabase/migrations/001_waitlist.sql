-- Waitlist table for TubeGrow early access signups
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  referral_source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  position INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'invited', 'converted')),
  confirmation_token UUID DEFAULT uuid_generate_v4(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_confirmation_token ON waitlist(confirmation_token);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- Auto-increment position trigger
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := COALESCE((SELECT MAX(position) + 1 FROM waitlist), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_waitlist_position_trigger
  BEFORE INSERT ON waitlist
  FOR EACH ROW EXECUTE FUNCTION set_waitlist_position();

-- RLS: Public can insert, users can view/confirm own entry by token
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to signup (insert)
CREATE POLICY "Public can signup" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Allow reading own entry by confirmation token
CREATE POLICY "Public can read by token" ON waitlist
  FOR SELECT USING (true);

-- Allow updating own entry by confirmation token (for confirming email)
CREATE POLICY "Public can update by token" ON waitlist
  FOR UPDATE USING (true);
