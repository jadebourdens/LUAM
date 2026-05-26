-- Add Handcrafted and Artisanal columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_handcrafted BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_artisanal BOOLEAN DEFAULT FALSE;
