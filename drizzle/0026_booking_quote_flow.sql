-- Add columns for quote flow
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS service_price decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_id text,
  ADD COLUMN IF NOT EXISTS quote_sent_at timestamp with time zone;

-- Update status to include new quote flow statuses
-- The status column already exists, we just use new values: 'quote_pending', 'quote_sent', 'quote_accepted', 'quote_rejected'
