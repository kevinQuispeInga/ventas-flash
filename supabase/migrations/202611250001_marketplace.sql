-- Ventas Flash: all money is integer PEN cents. Mutations run atomically in RPCs.
create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  status text not null default 'active' check (status in ('active','suspended')),
  identity_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create function private.handle_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Usuario'),80));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_user();

create table public.products (
  id text primary key check (id ~ '^[-a-zA-Z0-9_]{1,128}$'),
  seller_id uuid not null references public.profiles(id),
  seller_name text not null, seller_verified boolean not null default false,
  title text not null check(length(title) between 1 and 100),
  description text not null check(length(description) between 1 and 2000),
  category text not null check(length(category) between 1 and 40),
  mode text not null check(mode in ('normal','subasta','remate')),
  status text not null default 'active' check(status in ('active','closed','sold')),
  price_cents integer not null check(price_cents between 100 and 100000000),
  original_cents integer not null, floor_cents integer not null, step_cents integer not null default 0,
  increment_cents integer not null default 5000,
  image_path text not null default '',
  created_at timestamptz not null default now(), end_at timestamptz not null,
  leader_id uuid references public.profiles(id), winner_id uuid references public.profiles(id),
  bid_count integer not null default 0,
  latitude numeric, longitude numeric,
  location_label text not null default 'Lima, Perú',
  location_visibility text not null default 'approximate' check(location_visibility in ('approximate','exact','hidden')),
  is_live boolean not null default false
);
create table public.auto_bids (
  product_id text references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id), max_cents integer not null,
  priority bigint generated always as identity,
  automatic boolean not null,
  primary key(product_id,user_id)
);
create table public.bids (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id), bidder_id uuid not null references public.profiles(id),
  amount_cents integer not null, created_at timestamptz not null default now()
);
create table private.operations (
  user_id uuid not null, request_id uuid not null, product_id text not null,
  amount_cents integer not null, automatic boolean not null, result jsonb not null,
  primary key(user_id,request_id)
);
create table public.orders (
  id text primary key references public.products(id),
  buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id),
  title text not null, price_cents integer not null, fee_cents integer not null,
  status text not null default 'delivery_pending' check(status in ('delivery_pending','completed')),
  provider text not null default 'demo' check(provider='demo'),
  real_funds_held boolean not null default false check(not real_funds_held),
  created_at timestamptz not null default now(), received_at timestamptz,
  check(buyer_id <> seller_id)
);
create table public.messages (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id), sender_id uuid not null references public.profiles(id),
  text text not null check(length(trim(text)) between 1 and 1000), created_at timestamptz not null default now()
);
create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  primary key(user_id,product_id)
);
create table public.live_streams (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id),
  seller_name text not null, seller_verified boolean not null default false,
  title text not null check(length(trim(title)) between 1 and 120),
  description text not null default '' check(length(description)<=1000),
  status text not null default 'scheduled' check(status in ('scheduled','live','ended')),
  product_ids text[] not null default '{}', active_product_id text references public.products(id),
  viewer_count integer not null default 0,
  created_at timestamptz not null default now(), started_at timestamptz, ended_at timestamptz
);
create table public.live_messages (
  id bigint generated always as identity primary key,
  stream_id uuid not null references public.live_streams(id), sender_id uuid not null references public.profiles(id),
  sender_name text not null, is_seller boolean not null,
  text text not null check(length(trim(text)) between 1 and 300), created_at timestamptz not null default now()
);
create index products_created on public.products(created_at desc);
create index products_expiring on public.products(end_at) where mode='subasta' and status='active';
create index orders_buyer on public.orders(buyer_id);
create index orders_seller on public.orders(seller_id);
create index bids_product on public.bids(product_id,created_at desc);
create index messages_order on public.messages(order_id,created_at);
create index live_messages_stream on public.live_messages(stream_id,created_at);

create function private.actor(verified boolean default true) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Inicia sesión.'; end if;
  if not exists(select 1 from public.profiles where id=u and status='active') then raise exception 'Perfil no habilitado.'; end if;
  if verified and not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Verifica tu correo antes de operar.'; end if;
  return u;
end $$;
create function private.cents(amount numeric) returns integer language plpgsql immutable set search_path = '' as $$
begin
  if amount is null or amount < 1 or amount > 1000000 or amount::text in ('NaN','Infinity','-Infinity') or amount*100 <> round(amount*100) then
    raise exception 'Importe inválido (S/ 1 a S/ 1,000,000; dos decimales).';
  end if;
  return (amount*100)::integer;
end $$;
create function public.server_time() returns double precision language sql set search_path = '' as $$ select extract(epoch from clock_timestamp())*1000 $$;
create function public.update_profile(p_name text) returns void language plpgsql security definer set search_path = '' as $$
begin update public.profiles set name=trim(p_name) where id=private.actor(false); end $$;

create function public.create_product(p_data jsonb) returns text language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); pr public.profiles; amount integer := private.cents((p_data->>'price')::numeric);
  pid text := p_data->>'id'; visibility text := coalesce(p_data->>'locationVisibility','approximate');
  lat numeric := (p_data->>'latitude')::numeric; lon numeric := (p_data->>'longitude')::numeric;
  img text := coalesce(p_data->>'imagePath','');
begin
  select * into pr from public.profiles where id=u;
  if img <> '' and img <> u::text || '/' || pid || '/main' then raise exception 'Ruta de imagen inválida.'; end if;
  if lat is not null and (lat < -90 or lat > 90 or lat::text='NaN') or lon is not null and (lon < -180 or lon > 180 or lon::text='NaN') then raise exception 'Ubicación inválida.'; end if;
  if visibility='hidden' then lat:=null; lon:=null;
  elsif visibility='approximate' then lat:=round(lat,2); lon:=round(lon,2); end if;
  insert into public.products(id,seller_id,seller_name,seller_verified,title,description,category,mode,price_cents,original_cents,floor_cents,step_cents,image_path,end_at,latitude,longitude,location_label,location_visibility)
  values(pid,u,pr.name,pr.identity_verified,trim(p_data->>'title'),trim(p_data->>'description'),trim(p_data->>'category'),p_data->>'mode',amount,amount,
    case when p_data->>'mode'='remate' then round(amount*0.7)::integer else amount end,
    case when p_data->>'mode'='remate' then greatest(100,round(amount*0.02)::integer) else 0 end,
    img,now()+interval '3 minutes',lat,lon,
    case when visibility='hidden' then 'Ubicación oculta' else left(coalesce(p_data->>'locationLabel','Lima, Perú'),100) end,visibility);
  return pid;
end $$;
create function public.edit_product(p_id text,p_title text,p_description text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor();
begin
  update public.products set title=trim(p_title),description=trim(p_description)
  where id=p_id and seller_id=u and status='active' and bid_count=0 and (mode<>'subasta' or end_at>clock_timestamp());
  if not found then raise exception 'Solo puedes editar publicaciones propias activas sin pujas.'; end if;
end $$;

create function public.place_bid(p_id text,p_amount numeric,p_automatic boolean,p_request_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); amount integer := private.cents(p_amount); p public.products; old public.auto_bids;
  first_offer public.auto_bids; second_offer public.auto_bids; previous private.operations;
  base integer; competitive integer; price integer; extended boolean; result jsonb; t timestamptz;
begin
  if p_automatic is null or p_request_id is null then raise exception 'Solicitud inválida.'; end if;
  -- Serializes requests for this product, including purchases and scheduled closure.
  select * into p from public.products where id=p_id for update;
  if not found then raise exception 'Producto no encontrado.'; end if;
  select * into previous from private.operations where user_id=u and request_id=p_request_id;
  if found then
    if previous.product_id<>p_id or previous.amount_cents<>amount or previous.automatic<>p_automatic then raise exception 'ID de operación reutilizado.'; end if;
    return previous.result;
  end if;
  t:=clock_timestamp();
  if p.mode<>'subasta' or p.status<>'active' or p.end_at<=t or p.seller_id=u then raise exception 'No puedes pujar en esta publicación.'; end if;
  if amount < p.price_cents+p.increment_cents then raise exception 'Supera la puja actual por el incremento mínimo de S/ 50.'; end if;
  select * into old from public.auto_bids where product_id=p_id and user_id=u;
  if found and amount<old.max_cents then raise exception 'No puedes reducir una oferta comprometida.'; end if;
  if old.user_id is null and (select count(*) from public.auto_bids where product_id=p_id)>=100 then raise exception 'Límite de 100 participantes.'; end if;
  insert into public.auto_bids(product_id,user_id,max_cents,automatic) values(p_id,u,amount,p_automatic)
  on conflict(product_id,user_id) do update set max_cents=excluded.max_cents,automatic=excluded.automatic;
  select * into first_offer from public.auto_bids where product_id=p_id order by max_cents desc,priority,user_id limit 1;
  select * into second_offer from public.auto_bids where product_id=p_id order by max_cents desc,priority,user_id offset 1 limit 1;
  base:=case when not p_automatic then amount when p.leader_id=u then p.price_cents else p.price_cents+p.increment_cents end;
  competitive:=case when second_offer.user_id is null then base else least(first_offer.max_cents,second_offer.max_cents+p.increment_cents) end;
  price:=greatest(p.price_cents,least(first_offer.max_cents,greatest(base,competitive)));
  extended:=p.end_at-t<=interval '30 seconds';
  update public.products set price_cents=price,leader_id=first_offer.user_id,bid_count=bid_count+1,
    end_at=case when extended then end_at+interval '60 seconds' else end_at end where id=p_id;
  insert into public.bids(product_id,bidder_id,amount_cents) values(p_id,first_offer.user_id,price);
  result:=jsonb_build_object('extended',extended);
  insert into private.operations values(u,p_request_id,p_id,amount,p_automatic,result);
  return result;
end $$;
create function public.close_auction(p_id text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.actor();
  update public.products set status='closed',winner_id=leader_id where id=p_id and mode='subasta' and status='active' and end_at<=clock_timestamp();
end $$;
create function private.close_expired_auctions() returns void language sql security definer set search_path = '' as $$
  update public.products set status='closed',winner_id=leader_id where mode='subasta' and status='active' and end_at<=clock_timestamp();
$$;
create function public.purchase_product(p_id text,p_max_price numeric) returns text language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); max_price integer := private.cents(p_max_price); p public.products; o public.orders; price integer; t timestamptz;
begin
  select * into p from public.products where id=p_id for update;
  if not found then raise exception 'Producto no encontrado.'; end if;
  select * into o from public.orders where id=p_id;
  if found then
    if o.buyer_id=u then return o.id; end if;
    raise exception 'Este producto ya fue comprado.';
  end if;
  if p.seller_id=u or p.status not in ('active','closed') then raise exception 'Producto no disponible.'; end if;
  t:=clock_timestamp(); price:=p.price_cents;
  if p.mode='subasta' and (p.end_at>t or p.leader_id is distinct from u) then raise exception 'Solo el ganador puede comprar tras el cierre.'; end if;
  if p.mode='remate' then price:=greatest(p.floor_cents,p.original_cents-floor(greatest(0,extract(epoch from t-p.created_at))/30)*p.step_cents)::integer; end if;
  if price>max_price then raise exception 'El precio cambió. Revisa el total.'; end if;
  insert into public.orders(id,buyer_id,seller_id,title,price_cents,fee_cents) values(p_id,u,p.seller_id,p.title,price,round(price*0.04)::integer);
  update public.products set status='sold',winner_id=case when mode='subasta' then u else winner_id end where id=p_id;
  return p_id;
end $$;
create function public.confirm_receipt(p_id text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor();
begin
  update public.orders set status='completed',received_at=coalesce(received_at,now()) where id=p_id and buyer_id=u;
  if not found then raise exception 'Solo el comprador puede confirmar.'; end if;
end $$;
create function public.send_message(p_id text,p_text text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor();
begin
  if not exists(select 1 from public.orders where id=p_id and u in (buyer_id,seller_id)) then raise exception 'No tienes acceso a esta conversación.'; end if;
  insert into public.messages(order_id,sender_id,text) values(p_id,u,trim(p_text));
end $$;

create function public.create_live_stream(p_title text,p_description text,p_product_ids text[]) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); pr public.profiles; sid uuid;
begin
  if p_product_ids is null or cardinality(p_product_ids)>50 or exists(select 1 from unnest(p_product_ids) pid where not exists(select 1 from public.products where id=pid and seller_id=u and status='active')) then raise exception 'Selecciona productos propios activos (máximo 50).'; end if;
  select * into pr from public.profiles where id=u;
  insert into public.live_streams(seller_id,seller_name,seller_verified,title,description,product_ids,active_product_id)
  values(u,pr.name,pr.identity_verified,trim(p_title),trim(p_description),p_product_ids,p_product_ids[1]) returning id into sid;
  return sid;
end $$;
create function public.update_live_stream(p_id uuid,p_action text,p_product_id text default null) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); s public.live_streams;
begin
  select * into s from public.live_streams where id=p_id for update;
  if not found or s.seller_id<>u then raise exception 'Solo el anfitrión puede modificar el directo.'; end if;
  if p_action='start' then
    if s.status='ended' then raise exception 'El directo ya finalizó.'; end if;
    update public.live_streams set status='live',started_at=coalesce(started_at,now()) where id=p_id;
    update public.products set is_live=true where id=any(s.product_ids);
  elsif p_action='end' then
    update public.live_streams set status='ended',ended_at=coalesce(ended_at,now()) where id=p_id;
    update public.products p set is_live=exists(select 1 from public.live_streams l where l.status='live' and p.id=any(l.product_ids)) where p.id=any(s.product_ids);
  elsif p_action='feature' then
    if s.status='ended' or p_product_id is null or not(p_product_id=any(s.product_ids)) then raise exception 'Producto ajeno al directo.'; end if;
    update public.live_streams set active_product_id=p_product_id where id=p_id;
  else raise exception 'Acción inválida.';
  end if;
end $$;
create function public.send_live_message(p_id uuid,p_text text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := private.actor(); s public.live_streams;
begin
  select * into s from public.live_streams where id=p_id;
  if not found or s.status<>'live' then raise exception 'El directo no está en vivo.'; end if;
  insert into public.live_messages(stream_id,sender_id,sender_name,is_seller,text)
  select p_id,u,name,u=s.seller_id,trim(p_text) from public.profiles where id=u;
end $$;

-- Read access is scoped by RLS. Financial and identity fields have NO client write grants.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.auto_bids enable row level security;
alter table public.bids enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.live_streams enable row level security;
alter table public.live_messages enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy catalog on public.products for select to anon,authenticated using(true);
create policy own_ceiling on public.auto_bids for select to authenticated using(user_id=(select auth.uid()));
create policy bid_history on public.bids for select to anon,authenticated using(true);
create policy own_orders on public.orders for select to authenticated using((select auth.uid()) in (buyer_id,seller_id));
create policy own_messages on public.messages for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (select auth.uid()) in (o.buyer_id,o.seller_id)));
create policy own_favorites on public.favorites for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy live_catalog on public.live_streams for select to anon,authenticated using(true);
create policy live_chat on public.live_messages for select to anon,authenticated using(true);
revoke all on public.profiles,public.products,public.auto_bids,public.bids,public.orders,public.messages,public.favorites,public.live_streams,public.live_messages from anon,authenticated;
grant select on public.products,public.bids,public.live_streams,public.live_messages to anon,authenticated;
grant select on public.profiles,public.auto_bids,public.orders,public.messages,public.favorites to authenticated;
grant insert,delete on public.favorites to authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
revoke execute on function public.server_time(),public.update_profile(text),public.create_product(jsonb),public.edit_product(text,text,text),public.place_bid(text,numeric,boolean,uuid),public.close_auction(text),public.purchase_product(text,numeric),public.confirm_receipt(text),public.send_message(text,text),public.create_live_stream(text,text,text[]),public.update_live_stream(uuid,text,text),public.send_live_message(uuid,text) from public,anon,authenticated;
grant execute on function public.server_time() to anon,authenticated;
grant execute on function public.update_profile(text),public.create_product(jsonb),public.edit_product(text,text,text),public.place_bid(text,numeric,boolean,uuid),public.close_auction(text),public.purchase_product(text,numeric),public.confirm_receipt(text),public.send_message(text,text),public.create_live_stream(text,text,text[]),public.update_live_stream(uuid,text,text),public.send_live_message(uuid,text) to authenticated;
