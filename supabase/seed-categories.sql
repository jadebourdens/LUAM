-- Seed Vinted-style category hierarchy.
-- Safe to run multiple times: every INSERT is gated by ON CONFLICT (slug) DO NOTHING.
-- Paste this whole file into the Supabase SQL editor and click Run.

-- 1. Top-level categories
INSERT INTO public.categories (name, slug) VALUES
  ('Women',         'women'),
  ('Men',           'men'),
  ('Art & Design', 'designer'),
  ('Kids',          'kids'),
  ('Home',          'home'),
  ('Electronics',   'electronics'),
  ('Beauty',        'beauty'),
  ('Entertainment', 'entertainment')
ON CONFLICT (slug) DO NOTHING;

-- 2. Sub-categories under Women & Men
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id
FROM (VALUES
  ('Clothing',    'women-clothing',    'women'),
  ('Shoes',       'women-shoes',       'women'),
  ('Bags',        'women-bags',        'women'),
  ('Accessories', 'women-accessories', 'women'),
  ('Clothing',    'men-clothing',      'men'),
  ('Shoes',       'men-shoes',         'men'),
  ('Accessories', 'men-accessories',   'men'),
  ('Watches',     'men-watches',       'men')
) AS v(name, slug, parent_slug)
JOIN public.categories p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT
  CASE WHEN parent_id IS NULL THEN name ELSE '— ' || name END AS category,
  slug
FROM public.categories
ORDER BY COALESCE(parent_id::text, id::text), name;
