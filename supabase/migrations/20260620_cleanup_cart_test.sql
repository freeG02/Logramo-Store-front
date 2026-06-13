-- Remove the verification row inserted while confirming the cart_events anon
-- INSERT policy works. No-op on any healthy database; safe to keep in history.

delete from public.cart_events
where product_title = '__rls_test__' or country = 'TEST';
