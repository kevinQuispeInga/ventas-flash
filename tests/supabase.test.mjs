import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
// Real PostgreSQL; minimal Auth/Storage schemas substitute for hosted services.
// GoTrue, Realtime transport, upload MIME enforcement and pg_cron need a live project.
let db;
const seller='00000000-0000-0000-0000-000000000001', buyer='00000000-0000-0000-0000-000000000002';
const other='00000000-0000-0000-0000-000000000003', unverified='00000000-0000-0000-0000-000000000004';
const q=(sql,args=[])=>db.query(sql,args);
async function actor(id,role='authenticated') {
  await db.exec('reset role');
  await q("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
  await db.exec(`set role ${role}`);
}
async function admin(sql,args=[]) { await db.exec('reset role'); return q(sql,args); }
async function create(id,mode='normal',extra={}) {
  await actor(seller);
  await q('select public.create_product($1::jsonb)',[JSON.stringify({id,title:'Producto',description:'Descripción',category:'Tecnología',mode,price:100,...extra})]);
}
before(async()=>{
  db=new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
    grant usage on schema storage to authenticated;
    grant select,insert,delete on storage.objects to authenticated;
    create publication supabase_realtime;
  `);
  await db.exec(await readFile('supabase/migrations/202611250001_marketplace.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/202611250002_storage_realtime.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/202611250004_seller_commission.sql','utf8'));
  for (const [id,name] of [[seller,'Vendedor'],[buyer,'Comprador'],[other,'Otro'],[unverified,'Sin verificar']])
    await q('insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values($1,$2,$3)',[id,id===unverified?null:new Date().toISOString(),JSON.stringify({name,identity_verified:true})]);
});
after(async()=>{await db?.close();});
test('Registro: perfil privado y sin elevación de privilegios',async()=>{
  await actor(buyer);
  const rows=(await q('select * from public.profiles')).rows;
  assert.equal(rows.length,1); assert.equal(rows[0].identity_verified,false);
  await assert.rejects(q("update public.profiles set identity_verified=true"),/permission denied/);
  await assert.rejects(q('select private.close_expired_auctions()'),/permission denied/);
  await assert.rejects(q('select private.actor()'),/permission denied/);
  await q('select public.update_profile($1)',['Nuevo nombre']);
  assert.equal((await q('select name from public.profiles')).rows[0].name,'Nuevo nombre');
});
test('Ubicación oculta no se publica; aproximada pierde precisión en servidor',async()=>{
  await create('hidden','normal',{latitude:-12.123456,longitude:-77.012345,locationVisibility:'hidden',locationLabel:'Dirección privada'});
  await create('approx','normal',{latitude:-12.123456,longitude:-77.012345});
  await actor(null,'anon');
  const hidden=(await q("select * from public.products where id='hidden'")).rows[0];
  assert.equal(hidden.latitude,null); assert.equal(hidden.longitude,null); assert.equal(hidden.location_label,'Ubicación oculta');
  assert.equal(Number((await q("select latitude from public.products where id='approx'")).rows[0].latitude),-12.12);
  await assert.rejects(q("select public.purchase_product('hidden',100)"),/permission denied/);
});
test('Correo sin verificar y perfil suspendido no pueden operar',async()=>{
  await actor(unverified);
  await assert.rejects(q("select public.purchase_product('hidden',100)"),/Verifica tu correo/);
  await admin("update public.profiles set status='suspended' where id=$1",[other]);
  await actor(other);
  await assert.rejects(q("select public.purchase_product('hidden',100)"),/Perfil no habilitado/);
  await admin("update public.profiles set status='active' where id=$1",[other]);
});
test('Auto-puja privada, prioridad de empate, anti-robo e idempotencia',async()=>{
  await create('auction','subasta');
  await admin("update public.products set end_at=clock_timestamp()+interval '25 seconds' where id='auction'");
  await actor(buyer);
  const request='10000000-0000-0000-0000-000000000001';
  assert.equal((await q("select public.place_bid('auction',500,true,$1) as result",[request])).rows[0].result.extended,true);
  await q("select public.place_bid('auction',500,true,$1)",[request]);
  assert.equal((await q("select count(*)::int as n from public.bids where product_id='auction'")).rows[0].n,1);
  await assert.rejects(q("select public.place_bid('auction',550,true,$1)",[request]),/reutilizado/);
  await actor(other);
  assert.equal((await q("select * from public.auto_bids where product_id='auction'")).rows.length,0);
  await q("select public.place_bid('auction',500,true,$1)",['10000000-0000-0000-0000-000000000002']);
  const p=(await q("select * from public.products where id='auction'")).rows[0];
  assert.equal(p.leader_id,buyer); assert.equal(p.price_cents,50000);
  assert.ok(Date.parse(p.end_at)-Date.now()>60000);
  await assert.rejects(q("update public.products set price_cents=100 where id='auction'"),/permission denied/);
  await actor(seller);
  await assert.rejects(q("select public.place_bid('auction',600,false,$1)",['10000000-0000-0000-0000-000000000003']),/No puedes pujar/);
});
test('Subasta: solo ganador compra tras cierre, aun sin cron',async()=>{
  await actor(buyer);
  await assert.rejects(q("select public.purchase_product('auction',500)"),/Solo el ganador/);
  await admin("update public.products set end_at=clock_timestamp()-interval '1 second' where id='auction'");
  await actor(other);
  await assert.rejects(q("select public.purchase_product('auction',500)"),/Solo el ganador/);
  await actor(buyer); await q("select public.purchase_product('auction',500)");
  assert.equal((await q("select status from public.products where id='auction'")).rows[0].status,'sold');
});
test('Compra única, límite de precio, comisión, chat privado y recepción',async()=>{
  await create('sale'); await actor(buyer);
  await assert.rejects(q("select public.purchase_product('sale',99)"),/precio cambió/);
  await q("select public.purchase_with_seller_commission('sale',100)"); await q("select public.purchase_with_seller_commission('sale',100)");
  const o=(await q("select * from public.orders where id='sale'")).rows[0];
  assert.equal(o.fee_cents,400); assert.equal(o.real_funds_held,false);
  assert.equal(o.fee_payer,'seller'); assert.equal(o.buyer_total_cents,10000); assert.equal(o.seller_net_cents,9600);
  await q("select public.send_message('sale','Hola')"); await actor(other);
  assert.equal((await q("select * from public.orders where id='sale'")).rows.length,0);
  assert.equal((await q("select * from public.messages where order_id='sale'")).rows.length,0);
  await assert.rejects(q("select public.purchase_product('sale',100)"),/ya fue comprado/);
  await assert.rejects(q("select public.send_message('sale','Intruso')"),/No tienes acceso/);
  await actor(seller);
  assert.equal((await q("select * from public.messages where order_id='sale'")).rows.length,1);
  await assert.rejects(q("select public.confirm_receipt('sale')"),/Solo el comprador/);
  await actor(buyer); await q("select public.confirm_receipt('sale')"); await q("select public.confirm_receipt('sale')");
  assert.equal((await q("select status from public.orders where id='sale'")).rows[0].status,'completed');
});
test('Remate respeta reloj de servidor y precio mínimo',async()=>{
  await create('descending','remate');
  await admin("update public.products set created_at=now()-interval '1 hour' where id='descending'");
  await actor(buyer); await q("select public.purchase_product('descending',100)");
  assert.equal((await q("select price_cents from public.orders where id='descending'")).rows[0].price_cents,7000);
});
test('Favoritos privados; no se pueden escribir para otro usuario',async()=>{
  await actor(buyer); await q("insert into public.favorites values($1,'hidden')",[buyer]);
  await actor(other); assert.equal((await q('select * from public.favorites')).rows.length,0);
  await assert.rejects(q("insert into public.favorites values($1,'approx')",[buyer]),/row-level security/);
});
test('Live conserva propietario, catálogo, estado y autoría del chat',async()=>{
  await actor(other);
  await assert.rejects(q("select public.create_live_stream('Live','',array['hidden'])"),/productos propios/);
  await actor(seller);
  const id=(await q("select public.create_live_stream('Live','',array['hidden']) as id")).rows[0].id;
  await q("select public.update_live_stream($1,'start')",[id]); await actor(buyer);
  await assert.rejects(q("select public.update_live_stream($1,'end')",[id]),/Solo el anfitrión/);
  await q("select public.send_live_message($1,'Pregunta')",[id]);
  const m=(await q('select * from public.live_messages where stream_id=$1',[id])).rows[0];
  assert.equal(m.sender_id,buyer); assert.equal(m.is_seller,false);
  await actor(seller); await q("select public.update_live_stream($1,'end')",[id]);
  assert.equal((await q("select is_live from public.products where id='hidden'")).rows[0].is_live,false);
  await assert.rejects(q("select public.send_live_message($1,'Tarde')",[id]),/no está en vivo/);
});
test('Storage exige correo verificado y carpeta propia; protege fotos publicadas',async()=>{
  await actor(unverified);
  await assert.rejects(q("insert into storage.objects(bucket_id,name) values('products',$1)",[unverified+'/x/main']),/row-level security/);
  await actor(seller);
  await assert.rejects(q("insert into storage.objects(bucket_id,name) values('products',$1)",[buyer+'/x/main']),/row-level security/);
  const path=seller+'/photo/main';
  await q("insert into storage.objects(bucket_id,name) values('products',$1)",[path]);
  await create('photo','normal',{imagePath:path});
  assert.equal((await q('delete from storage.objects where name=$1 returning name',[path])).rows.length,0);
  await actor(other); assert.equal((await q('select * from storage.objects')).rows.length,0);
});
test('Cierre programado interno fija estado sin navegador',async()=>{
  await create('expired','subasta');
  await admin("update public.products set end_at=clock_timestamp()-interval '1 minute' where id='expired'");
  await q('select private.close_expired_auctions()');
  assert.equal((await q("select status from public.products where id='expired'")).rows[0].status,'closed');
});
