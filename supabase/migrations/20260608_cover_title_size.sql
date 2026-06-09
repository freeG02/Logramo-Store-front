-- Adds a per-product control for the cover title font size (in cqw units,
-- relative to the cover width). NULL = use the default (15.5cqw).
-- Set from the dashboard product editor via the "Title size on cover" slider.
alter table public.products
  add column if not exists cover_title_size numeric;
