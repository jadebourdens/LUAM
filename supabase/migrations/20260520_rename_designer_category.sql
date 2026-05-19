-- Rename Designer category label to Art & Design (slug unchanged for existing listings)
UPDATE public.categories
SET name = 'Art & Design'
WHERE slug = 'designer';
