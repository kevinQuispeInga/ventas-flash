-- Preserve the terms of existing orders; new sales deduct commission from the seller.
alter table public.orders add column fee_payer text not null default 'buyer'
  check (fee_payer in ('buyer','seller'));
alter table public.orders alter column fee_payer set default 'seller';
alter table public.orders add column buyer_total_cents integer generated always as
  (price_cents + case when fee_payer='buyer' then fee_cents else 0 end) stored;
alter table public.orders add column seller_net_cents integer generated always as
  (price_cents - case when fee_payer='seller' then fee_cents else 0 end) stored;

-- A versioned RPC prevents new clients from buying against an unmigrated database.
create function public.purchase_with_seller_commission(p_id text,p_max_price numeric)
returns text language sql security invoker set search_path = '' as $$
  select public.purchase_product(p_id,p_max_price);
$$;
revoke all on function public.purchase_with_seller_commission(text,numeric) from public,anon;
grant execute on function public.purchase_with_seller_commission(text,numeric) to authenticated;
