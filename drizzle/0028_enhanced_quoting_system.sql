-- Enhanced quoting system: pricing rules, packages, extras, discounts

-- Add pricing rules and default deposit percent to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS default_deposit_percent integer DEFAULT 30;

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS pricing_rules jsonb DEFAULT '{}'::jsonb;

-- Create service_packages table
CREATE TABLE IF NOT EXISTS service_packages (
  id serial PRIMARY KEY,
  service_id integer REFERENCES services(id) ON DELETE CASCADE,
  artist_id text REFERENCES users(id) ON DELETE CASCADE,
  studio_id text REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL,
  includes jsonb DEFAULT '[]'::jsonb,
  duration varchar(50),
  popular boolean DEFAULT false,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS service_packages_service_idx ON service_packages(service_id);
CREATE INDEX IF NOT EXISTS service_packages_artist_idx ON service_packages(artist_id);
CREATE INDEX IF NOT EXISTS service_packages_studio_idx ON service_packages(studio_id);

-- Add enhanced booking columns
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS selected_quote_option_id integer;

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS discount decimal(10, 2) DEFAULT '0';

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS discount_reason varchar(255);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS extras jsonb DEFAULT '[]'::jsonb;

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS package_name varchar(255);

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS deposit_percent integer DEFAULT 30;

-- Create quote_options table
CREATE TABLE IF NOT EXISTS quote_options (
  id serial PRIMARY KEY,
  booking_id integer REFERENCES bookings(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  service_price decimal(10, 2) NOT NULL,
  travel_fee decimal(10, 2) DEFAULT '0',
  accommodation_fee decimal(10, 2) DEFAULT '0',
  discount decimal(10, 2) DEFAULT '0',
  discount_reason varchar(255),
  extras jsonb DEFAULT '[]'::jsonb,
  selected boolean DEFAULT false,
  selected_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS quote_options_booking_idx ON quote_options(booking_id);
