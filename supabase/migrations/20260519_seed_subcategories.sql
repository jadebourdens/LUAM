-- Sub-categories under Women & Men. Idempotent via ON CONFLICT(slug).
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
