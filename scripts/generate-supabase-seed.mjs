import { writeFileSync } from "node:fs";
import { build } from "esbuild";

// Bundle seedData to load cleanly in ESM
const bundle = await build({
  entryPoints: ["src/data/seedData.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});

const {
  SEED_USERS,
  DEFAULT_TEST_PASSWORD,
  getSeedProducts,
  getSeedLiveStreams,
  getSeedLiveMessages,
  getSeedOrders,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);

// Map seed slugs to fixed, reproducible UUIDs
export const USER_UUID_MAP = {
  "usr-seller-diego": "a0000000-0000-0000-0000-000000000001",
  "usr-seller-camila": "a0000000-0000-0000-0000-000000000002",
  "usr-seller-andres": "a0000000-0000-0000-0000-000000000003",
  "usr-seller-lucia": "a0000000-0000-0000-0000-000000000004",
  "usr-seller-mateo": "a0000000-0000-0000-0000-000000000005",
  "usr-seller-valeria": "a0000000-0000-0000-0000-000000000006",
  "usr-buyer-marta": "b0000000-0000-0000-0000-000000000001",
  "usr-buyer-carlos": "b0000000-0000-0000-0000-000000000002",
  "usr-buyer-renato": "b0000000-0000-0000-0000-000000000003",
  "usr-buyer-sofia": "b0000000-0000-0000-0000-000000000004",
  "usr-buyer-javier": "b0000000-0000-0000-0000-000000000005",
  "usr-buyer-gabriela": "b0000000-0000-0000-0000-000000000006",
  "usr-buyer-fernando": "b0000000-0000-0000-0000-000000000007",
  "usr-buyer-patricia": "b0000000-0000-0000-0000-000000000008",
  "usr-buyer-rodrigo": "b0000000-0000-0000-0000-000000000009",
};

export const LIVE_UUID_MAP = {
  "live-stream-01": "c0000000-0000-0000-0000-000000000001",
  "live-stream-02": "c0000000-0000-0000-0000-000000000002",
  "live-stream-03": "c0000000-0000-0000-0000-000000000003",
  "live-stream-04": "c0000000-0000-0000-0000-000000000004",
  "live-stream-05": "c0000000-0000-0000-0000-000000000005",
};

const esc = (s) => (s ? "'" + String(s).replace(/'/g, "''") + "'" : "null");
const now = Date.now();

let sql = `-- =====================================================================
-- VENTAS FLASH · SEED COMPLETO PARA SUPABASE (IDEMPOTENTE)
-- 15 Usuarios (6 vendedores, 9 compradores)
-- 60 Productos (25 normales, 25 subastas, 10 remates)
-- 5 Transmisiones Flash Live con chat público
-- Órdenes históricas con chat postventa bilateral
-- =====================================================================

create extension if not exists pgcrypto;

-- 1. USUARIOS FICTICIOS EN AUTH.USERS Y PROFILES
`;

for (const u of SEED_USERS) {
  const uuid = USER_UUID_MAP[u.id];
  const email = u.email;
  const name = u.name;
  const verified = u.identityVerified ? "true" : "false";

  sql += `
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  '${uuid}',
  'authenticated',
  'authenticated',
  '${email}',
  extensions.crypt('${DEFAULT_TEST_PASSWORD}', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', ${esc(name)}),
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_user_meta_data = excluded.raw_user_meta_data,
  confirmation_token = '',
  recovery_token = '',
  email_change = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  reauthentication_token = '',
  is_sso_user = false,
  is_anonymous = false;

insert into public.profiles (id, name, status, identity_verified)
values ('${uuid}', ${esc(name)}, 'active', ${verified})
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;
`;
}

// 2. PRODUCTOS
sql += `\n-- 2. CATÁLOGO DE 60 PRODUCTOS\n`;
const products = getSeedProducts(now);

for (const p of products) {
  const sellerUuid = USER_UUID_MAP[p.sellerId];
  const leaderUuid = p.leaderId ? USER_UUID_MAP[p.leaderId] : null;
  const winnerUuid = p.winnerId ? USER_UUID_MAP[p.winnerId] : null;

  const priceCents = Math.round(p.price * 100);
  const origCents = Math.round((p.original ?? p.price) * 100);
  const floorCents = Math.round((p.floor ?? p.price) * 100);
  const stepCents = Math.round((p.step ?? 0) * 100);
  const incCents = 5000;
  const isLive = p.isLive ? "true" : "false";
  const sellerVerified = p.sellerVerified ? "true" : "false";

  sql += `
insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  ${esc(p.id)},
  '${sellerUuid}',
  ${esc(p.seller)},
  ${sellerVerified},
  ${esc(p.title)},
  ${esc(p.description)},
  ${esc(p.category)},
  ${esc(p.mode)},
  ${esc(p.status)},
  ${priceCents},
  ${origCents},
  ${floorCents},
  ${stepCents},
  ${incCents},
  ${esc(p.image)},
  to_timestamp(${p.created / 1000.0}),
  to_timestamp(${p.end / 1000.0}),
  ${leaderUuid ? `'${leaderUuid}'` : "null"},
  ${winnerUuid ? `'${winnerUuid}'` : "null"},
  ${p.bids ? p.bids.length : 0},
  ${p.latitude != null ? p.latitude : "null"},
  ${p.longitude != null ? p.longitude : "null"},
  ${esc(p.locationLabel || "Lima, Perú")},
  'approximate',
  ${isLive}
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;
`;
}

// 3. PUJAS Y AUTO-PUJAS
sql += `\n-- 3. PUJAS HISTÓRICAS\n`;
for (const p of products) {
  if (p.bids && p.bids.length > 0) {
    for (const b of p.bids) {
      const bidderUuid = USER_UUID_MAP[b.bidderId];
      if (bidderUuid) {
        const amtCents = Math.round(b.amount * 100);
        sql += `insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values (${esc(p.id)}, '${bidderUuid}', ${amtCents}, to_timestamp(${b.time / 1000.0}));\n`;
      }
    }
  }
}

// 4. TRANSMISIONES FLASH LIVE
sql += `\n-- 4. TRANSMISIONES FLASH LIVE\n`;
const liveStreams = getSeedLiveStreams(now);
for (const l of liveStreams) {
  const streamUuid = LIVE_UUID_MAP[l.id];
  const sellerUuid = USER_UUID_MAP[l.sellerId];
  const prodArray = "array[" + l.productIds.map((id) => esc(id)).join(",") + "]::text[]";
  const startedAt = l.startedAt ? `to_timestamp(${l.startedAt / 1000.0})` : "null";
  const endedAt = l.endedAt ? `to_timestamp(${l.endedAt / 1000.0})` : "null";

  sql += `
insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  '${streamUuid}',
  '${sellerUuid}',
  ${esc(l.sellerName)},
  ${l.sellerVerified ? "true" : "false"},
  ${esc(l.title)},
  ${esc(l.description)},
  ${prodArray},
  ${esc(l.activeProductId)},
  ${esc(l.status)},
  ${l.viewerCount || 0},
  to_timestamp(${l.createdAt / 1000.0}),
  ${startedAt},
  ${endedAt}
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;
`;
}

// 5. MENSAJES DE CHAT PÚBLICO FLASH LIVE
sql += `\n-- 5. MENSAJES DE CHAT PÚBLICO FLASH LIVE\n`;
const liveMessages = getSeedLiveMessages(now);
for (const [streamSlug, msgs] of Object.entries(liveMessages)) {
  const streamUuid = LIVE_UUID_MAP[streamSlug];
  if (streamUuid) {
    for (const m of msgs) {
      const senderUuid = USER_UUID_MAP[m.senderId];
      if (senderUuid) {
        sql += `insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('${streamUuid}', '${senderUuid}', ${esc(m.senderName)}, ${m.isSeller ? "true" : "false"}, ${esc(m.text)}, to_timestamp(${m.createdAt / 1000.0}));\n`;
      }
    }
  }
}

// 6. ÓRDENES Y CHAT POSTVENTA
sql += `\n-- 6. ÓRDENES Y CHAT POSTVENTA\n`;
const orders = getSeedOrders(now);
for (const o of orders) {
  const buyerUuid = USER_UUID_MAP[o.buyerId];
  const sellerUuid = USER_UUID_MAP[o.sellerId];
  const priceCents = Math.round(o.price * 100);
  const feeCents = Math.round(o.fee * 100);
  const status = o.status;
  const receivedAt = o.received ? "now()" : "null";

  sql += `
insert into public.orders (
  id, buyer_id, seller_id, title, price_cents, fee_cents, status, provider, real_funds_held, created_at, received_at
) values (
  ${esc(o.productId)},
  '${buyerUuid}',
  '${sellerUuid}',
  ${esc(o.title)},
  ${priceCents},
  ${feeCents},
  ${esc(status)},
  'demo',
  false,
  now() - interval '2 hours',
  ${receivedAt}
) on conflict (id) do update set
  status = excluded.status,
  received_at = excluded.received_at;
`;

  if (o.messages) {
    for (const msg of o.messages) {
      const msgSenderUuid = USER_UUID_MAP[msg.senderId];
      if (msgSenderUuid) {
        sql += `insert into public.messages (order_id, sender_id, text, created_at)
values (${esc(o.productId)}, '${msgSenderUuid}', ${esc(msg.text)}, to_timestamp(${msg.time / 1000.0}));\n`;
      }
    }
  }
}

// 7. FAVORITOS DE EJEMPLO
sql += `\n-- 7. FAVORITOS DE EJEMPLO
insert into public.favorites (user_id, product_id)
values
  ('${USER_UUID_MAP["usr-buyer-marta"]}', 'prod-sub-01'),
  ('${USER_UUID_MAP["usr-buyer-marta"]}', 'prod-dir-01'),
  ('${USER_UUID_MAP["usr-buyer-carlos"]}', 'prod-sub-02'),
  ('${USER_UUID_MAP["usr-buyer-carlos"]}', 'prod-rem-01')
on conflict do nothing;
`;

writeFileSync("supabase/seed.sql", sql, "utf8");
console.log("Generado exitosamente supabase/seed.sql con:");
console.log(`- ${SEED_USERS.length} usuarios`);
console.log(`- ${products.length} productos`);
console.log(`- ${liveStreams.length} salas de Flash Live`);
