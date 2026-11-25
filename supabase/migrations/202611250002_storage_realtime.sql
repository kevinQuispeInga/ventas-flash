insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('products','products',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create function private.can_upload() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users u join public.profiles p on p.id=u.id
    where u.id=auth.uid() and u.email_confirmed_at is not null and p.status='active');
$$;
revoke all on function private.can_upload() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.can_upload() to authenticated;
create policy product_image_upload on storage.objects for insert to authenticated
with check(bucket_id='products' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (select private.can_upload()));
-- Only unpublished uploads may be removed. Published product photos are immutable to clients.
create policy own_unpublished_image on storage.objects for select to authenticated
using(bucket_id='products' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy delete_unpublished_image on storage.objects for delete to authenticated
using(bucket_id='products' and (storage.foldername(name))[1]=(select auth.uid())::text
  and not exists(select 1 from public.products p where p.image_path=name));

alter publication supabase_realtime add table public.products,public.profiles,public.bids,public.auto_bids,public.orders,public.messages,public.favorites,public.live_streams,public.live_messages;
