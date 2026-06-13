-- MULTI-ITEM CART CHECKOUT support for public.purchases.
--
-- A cart order is ONE PayPal order that can contain several guides. The
-- record-purchase edge function writes one purchases row per guide, all
-- sharing the same paypal_order_id. If the table ever had a single-column
-- UNIQUE(paypal_order_id) constraint/index, only the first guide would
-- insert and the rest would silently fail (no row -> no PDF email).
--
-- This migration is defensive + idempotent: it drops any UNIQUE that is on
-- paypal_order_id ALONE (constraint or index), and leaves everything else
-- untouched. Idempotency for re-runs is handled in code (the function skips
-- product ids already recorded for the order), so no replacement unique is
-- required. Safe to run whether or not such a constraint currently exists.

do $$
declare
  r record;
begin
  -- 1) Drop UNIQUE *constraints* whose only column is paypal_order_id.
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'purchases'
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by a.attname::text)
        from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
      ) = array['paypal_order_id']
  loop
    execute format('alter table public.purchases drop constraint %I', r.conname);
    raise notice 'Dropped unique constraint % on purchases(paypal_order_id)', r.conname;
  end loop;

  -- 2) Drop standalone UNIQUE *indexes* on paypal_order_id alone that are not
  --    backing a constraint (covered above).
  for r in
    select i.relname as idxname
    from pg_index ix
    join pg_class i on i.oid = ix.indexrelid
    join pg_class t on t.oid = ix.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'purchases'
      and ix.indisunique
      and not exists (select 1 from pg_constraint c where c.conindid = ix.indexrelid)
      and (
        select array_agg(a.attname::text order by a.attname::text)
        from pg_attribute a
        where a.attrelid = ix.indrelid and a.attnum = any(ix.indkey)
      ) = array['paypal_order_id']
  loop
    execute format('drop index if exists public.%I', r.idxname);
    raise notice 'Dropped unique index % on purchases(paypal_order_id)', r.idxname;
  end loop;
end $$;
