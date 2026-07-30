ALTER TABLE services ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'event';
CREATE INDEX IF NOT EXISTS services_category_idx ON services (category);
