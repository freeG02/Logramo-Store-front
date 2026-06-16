-- Page count for a guide, entered in the admin ("Pages" field) and shown in the
-- product/freebie download modal meta line (e.g. "24 páginas · PDF · …").
-- Nullable; existing rows stay NULL and the modal simply omits the count.
alter table public.products add column if not exists pages integer;
