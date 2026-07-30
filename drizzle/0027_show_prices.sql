-- Add show_prices toggle to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS show_prices boolean DEFAULT false;
