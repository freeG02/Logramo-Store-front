-- ONE purchase-confirmation email per ORDER (not per row).
--
-- Until now, trg_purchase_email fired send-purchase on EVERY purchases insert.
-- With multi-item cart orders that writes one row per guide, that would send
-- one email per guide. Instead, record-purchase (the only writer of purchases,
-- since the open INSERT policy was dropped in 20260618) now calls send-purchase
-- itself ONCE per order, with the full item list, so the buyer gets a single
-- email containing a download link for each guide.
--
-- So we drop the per-row trigger to avoid double-sending. The subscriber
-- welcome trigger is unrelated and stays.
--
-- NOTE: if you ever insert a purchases row by hand (outside record-purchase),
-- it will NOT auto-email. Use the record-purchase function or call
-- send-purchase manually for those.

drop trigger if exists trg_purchase_email on public.purchases;
