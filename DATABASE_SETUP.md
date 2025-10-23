# Database Setup for Ticket Comments

## SQL Script to Run in Supabase

Execute this SQL in your Supabase SQL Editor to create the `ticket_comments` table:

```sql
-- Create ticket_comments table
CREATE TABLE ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
-- Allow authenticated users to read all comments
CREATE POLICY "Allow read access to all authenticated users"
  ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Allow authenticated users to create comments"
  ON ticket_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments"
  ON ticket_comments
  FOR UPDATE
  TO authenticated
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

-- Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments"
  ON ticket_comments
  FOR DELETE
  TO authenticated
  USING (user_email = auth.jwt()->>'email');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_comments_updated_at();
```

---

# Shift Management Tables (NowPage)

## SQL Script for Shifts

Execute this SQL in your Supabase SQL Editor:

```sql
-- Tabla de turnos (shifts) - Ya creada
-- Si necesitas crearla:
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tickets del turno - Ejecutar si aún no existe
CREATE TABLE IF NOT EXISTS shift_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  priority INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_shift_tickets_shift_id ON shift_tickets(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_tickets_ticket_id ON shift_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_email ON shifts(user_email);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_date ON shifts(shift_date);

-- Constraint para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_tickets_unique ON shift_tickets(shift_id, ticket_id);

-- RLS Policies para shift_tickets
ALTER TABLE shift_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read shift_tickets"
  ON shift_tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert shift_tickets"
  ON shift_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update shift_tickets"
  ON shift_tickets
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete shift_tickets"
  ON shift_tickets
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies para shifts (si no las tienes)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Allow users to create their own shifts"
  ON shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "Allow users to update their own shifts"
  ON shifts
  FOR UPDATE
  TO authenticated
  USING (user_email = auth.jwt()->>'email');
```

---

## How to Apply

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** section
3. Create a new query
4. Copy and paste the entire SQL script above
5. Click **Run** or press `Ctrl+Enter`

## Verify

After running the script, verify the table was created:

```sql
-- Check if table exists
SELECT * FROM ticket_comments LIMIT 1;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ticket_comments';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'ticket_comments';

-- Check shift_tickets
SELECT * FROM shift_tickets LIMIT 1;
```

## Next Steps

Once the table is created:
1. The `TicketDetailPage` will automatically start saving comments to the database
2. Real-time updates are already configured via Supabase subscriptions
3. Comments will persist across sessions
4. Users can only edit/delete their own comments (enforced by RLS)

## Troubleshooting

If you get permission errors:
- Make sure you're authenticated in your app
- Check that the `tickets` table exists (foreign key dependency)
- Verify RLS policies match your auth setup
