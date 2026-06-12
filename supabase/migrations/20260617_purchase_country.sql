-- Capture the buyer's country on each purchase so the dashboard "Countries by
-- sales" panel can populate. Stamped client-side from the geo the currency
-- system already detects. Nullable; existing rows stay NULL.
alter table public.purchases add column if not exists country text;
