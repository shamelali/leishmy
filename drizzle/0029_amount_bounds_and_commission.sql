ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission_rate numeric(5, 2) DEFAULT 30;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS min_amount numeric(10, 2) DEFAULT 50;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS max_amount numeric(10, 2) DEFAULT 50000;
