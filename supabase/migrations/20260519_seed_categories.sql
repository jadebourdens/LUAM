-- Seed top-level Vinted-style categories. Idempotent via ON CONFLICT(slug).
INSERT INTO public.categories (name, slug) VALUES
  ('Women', 'women'),
  ('Men', 'men'),
  ('Art & Design', 'designer'),
  ('Kids', 'kids'),
  ('Home', 'home'),
  ('Electronics', 'electronics'),
  ('Beauty', 'beauty'),
  ('Entertainment', 'entertainment')
ON CONFLICT (slug) DO NOTHING;
