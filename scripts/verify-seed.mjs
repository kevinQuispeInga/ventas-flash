import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

async function testSeed() {
  const db = new PGlite();
  await db.exec(`
    create role authenticated; create role anon;
    create schema auth;
    create table auth.users(
      instance_id uuid, id uuid primary key, aud text, role text, email text,
      encrypted_password text, email_confirmed_at timestamptz,
      raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}',
      created_at timestamptz default now(), updated_at timestamptz default now(),
      confirmation_token text, recovery_token text
    );
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  `);
  await db.exec(await readFile("supabase/migrations/202611250001_marketplace.sql", "utf8"));
  console.log("Migration 1 applied.");
  await db.exec(await readFile("supabase/seed.sql", "utf8"));
  console.log("Seed applied successfully!");
  const users = await db.query("select count(*) from auth.users");
  const prods = await db.query("select count(*) from public.products");
  const lives = await db.query("select count(*) from public.live_streams");
  const bids = await db.query("select count(*) from public.bids");
  const orders = await db.query("select count(*) from public.orders");
  console.log("Verification counts:", {
    users: users.rows[0].count,
    products: prods.rows[0].count,
    lives: lives.rows[0].count,
    bids: bids.rows[0].count,
    orders: orders.rows[0].count,
  });
  await db.close();
}

testSeed().catch((err) => {
  console.error("Error verifying seed:", err);
  process.exit(1);
});
