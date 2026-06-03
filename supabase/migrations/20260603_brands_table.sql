-- Brands table for storing user-created and common brands
CREATE TABLE public.brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common brands
INSERT INTO public.brands (name, usage_count) VALUES
  ('Nike', 1),
  ('Adidas', 1),
  ('Puma', 1),
  ('Gucci', 1),
  ('Louis Vuitton', 1),
  ('Chanel', 1),
  ('Dior', 1),
  ('Zara', 1),
  ('H&M', 1),
  ('ASOS', 1),
  ('Forever 21', 1),
  ('Uniqlo', 1),
  ('Gap', 1),
  ('Banana Republic', 1),
  ('Tommy Hilfiger', 1),
  ('Ralph Lauren', 1),
  ('Calvin Klein', 1),
  ('Hugo Boss', 1),
  ('Burberry', 1),
  ('Miu Miu', 1),
  ('Prada', 1),
  ('Fendi', 1),
  ('Celine', 1),
  ('Valentino', 1),
  ('Versace', 1),
  ('Dolce Gabbana', 1)
ON CONFLICT (name) DO UPDATE SET usage_count = usage_count + 1;

-- Index for fast queries
CREATE INDEX idx_brands_name ON public.brands(name);
