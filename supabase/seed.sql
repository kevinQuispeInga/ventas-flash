-- =====================================================================
-- VENTAS FLASH · SEED COMPLETO PARA SUPABASE (IDEMPOTENTE)
-- 15 Usuarios (6 vendedores, 9 compradores)
-- 60 Productos (25 normales, 25 subastas, 10 remates)
-- 5 Transmisiones Flash Live con chat público
-- Órdenes históricas con chat postventa bilateral
-- =====================================================================

create extension if not exists pgcrypto;

-- 1. USUARIOS FICTICIOS EN AUTH.USERS Y PROFILES

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'diego.vendedor@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Diego Rodríguez'),
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
values ('a0000000-0000-0000-0000-000000000001', 'Diego Rodríguez', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'camila.vendedora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Camila Paredes'),
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
values ('a0000000-0000-0000-0000-000000000002', 'Camila Paredes', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'andres.vendedor@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Andrés Mendoza'),
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
values ('a0000000-0000-0000-0000-000000000003', 'Andrés Mendoza', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'lucia.vendedora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Lucía Vega'),
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
values ('a0000000-0000-0000-0000-000000000004', 'Lucía Vega', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'mateo.vendedor@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Mateo Quispe'),
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
values ('a0000000-0000-0000-0000-000000000005', 'Mateo Quispe', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000006',
  'authenticated',
  'authenticated',
  'valeria.vendedora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Valeria Flores'),
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
values ('a0000000-0000-0000-0000-000000000006', 'Valeria Flores', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'marta.compradora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Marta Castillo'),
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
values ('b0000000-0000-0000-0000-000000000001', 'Marta Castillo', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'carlos.comprador@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Carlos Ramos'),
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
values ('b0000000-0000-0000-0000-000000000002', 'Carlos Ramos', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'renato.comprador@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Renato Morales'),
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
values ('b0000000-0000-0000-0000-000000000003', 'Renato Morales', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'sofia.compradora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Sofía Alarcón'),
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
values ('b0000000-0000-0000-0000-000000000004', 'Sofía Alarcón', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'javier.comprador@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Javier Salazar'),
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
values ('b0000000-0000-0000-0000-000000000005', 'Javier Salazar', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000006',
  'authenticated',
  'authenticated',
  'gabriela.compradora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Gabriela Benavides'),
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
values ('b0000000-0000-0000-0000-000000000006', 'Gabriela Benavides', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000007',
  'authenticated',
  'authenticated',
  'fernando.comprador@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Fernando Chávez'),
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
values ('b0000000-0000-0000-0000-000000000007', 'Fernando Chávez', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000008',
  'authenticated',
  'authenticated',
  'patricia.compradora@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Patricia Villanueva'),
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
values ('b0000000-0000-0000-0000-000000000008', 'Patricia Villanueva', 'active', true)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000009',
  'authenticated',
  'authenticated',
  'rodrigo.comprador@ventasflash.pe',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', 'Rodrigo Herrera'),
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
values ('b0000000-0000-0000-0000-000000000009', 'Rodrigo Herrera', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  identity_verified = excluded.identity_verified;

-- 2. CATÁLOGO DE 60 PRODUCTOS

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-01',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'MacBook Air M1 256GB - Gris Espacial',
  'Chip M1, 8GB RAM, 256GB SSD. Batería en 92% de vida útil. Incluye cargador de 30W original y funda de neopreno. Entrega coordinada en Parque Kennedy.',
  'Laptops',
  'subasta',
  'active',
  115000,
  240000,
  105000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637574.76),
  to_timestamp(1795641474.76),
  'b0000000-0000-0000-0000-000000000002',
  null,
  3,
  -12.1239,
  -77.0298,
  'Miraflores, Lima',
  'approximate',
  true
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-02',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'iPhone 15 Pro 128GB - Titanio Natural',
  'Libre de fábrica para cualquier operador en Perú. Sin rayones, mica de vidrio puesta desde el primer día. Incluye cable USB-C trenzado.',
  'Celulares',
  'subasta',
  'active',
  275000,
  390000,
  250000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795633974.76),
  to_timestamp(1795641594.76),
  'b0000000-0000-0000-0000-000000000004',
  null,
  2,
  -12.0981,
  -77.0311,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-03',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Consola PlayStation 5 Slim 1TB + 2 Mandos',
  'Versión con lector de disco, 1TB SSD. Viene con 2 mandos DualSense originales y cables HDMI 2.1. Poco uso, sin fallas de ventilación.',
  'Videojuegos',
  'subasta',
  'active',
  185000,
  260000,
  160000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635774.76),
  to_timestamp(1795641354.76),
  'b0000000-0000-0000-0000-000000000005',
  null,
  2,
  -12.0886,
  -77.0019,
  'San Borja, Lima',
  'approximate',
  true
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-04',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Cámara Sony Alpha A7 III (Solo Cuerpo)',
  'Sensor Full Frame impecable, 18k disparos de obturador. Incluye 2 baterías Sony NP-FZ100, cargador dual y correa original.',
  'Fotografía',
  'subasta',
  'active',
  360000,
  520000,
  320000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795630374.76),
  to_timestamp(1795641774.76),
  'b0000000-0000-0000-0000-000000000009',
  null,
  2,
  -12.1373,
  -76.9926,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-05',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Guitarra Electroacústica Fender FA-125CE',
  'Tapa de abeto laminado, pastilla Fishman con afinador integrado. Cuerdas D''Addario 0.11 puestas hace dos semanas. Incluye funda acolchada.',
  'Música',
  'subasta',
  'active',
  55000,
  95000,
  45000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636974.76),
  to_timestamp(1795641714.76),
  'b0000000-0000-0000-0000-000000000003',
  null,
  2,
  -12.1468,
  -77.0234,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-06',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'iPad Pro M4 11'''' 256GB Wi-Fi - Plata',
  'Pantalla OLED Ultra Retina XDR, chip M4. Menos de 3 meses de uso, incluye Apple Pencil Pro y Smart Folio original.',
  'Tecnología',
  'subasta',
  'active',
  320000,
  440000,
  290000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795638174.76),
  to_timestamp(1795641414.76),
  'b0000000-0000-0000-0000-000000000007',
  null,
  1,
  -12.1179,
  -77.0286,
  'Miraflores, Lima',
  'approximate',
  true
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-07',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Zapatillas Nike Dunk Low Retro Panda Talla 42',
  '100% originales compradas en tienda oficial. Condición 9.5/10, caja original intacta y hormas protectoras.',
  'Zapatillas',
  'subasta',
  'active',
  38000,
  59000,
  30000,
  2000,
  5000,
  'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795633174.76),
  to_timestamp(1795641534.76),
  'b0000000-0000-0000-0000-000000000005',
  null,
  2,
  -12.0761,
  -77.053,
  'Jesús María, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-08',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Nintendo Switch OLED - Edición Zelda Tears of the Kingdom',
  'Consola en edición limitada. Pantalla de 7 pulgadas OLED perfecta, incluye dock dorado, joycons temáticos y estuche viajero.',
  'Videojuegos',
  'subasta',
  'active',
  110000,
  165000,
  95000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635174.76),
  to_timestamp(1795641654.76),
  'b0000000-0000-0000-0000-000000000002',
  null,
  1,
  -12.0934,
  -77.07,
  'Magdalena, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-09',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Bicicleta Gravel Trek Checkpoint ALR 4 Talla M',
  'Cuadro de aluminio Alpha serie 300, transmisión Shimano GRX 2x10, frenos hidráulicos. Mantenimiento recién realizado en taller especializado.',
  'Deportes',
  'subasta',
  'active',
  290000,
  520000,
  250000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795629174.76),
  to_timestamp(1795641894.76),
  'b0000000-0000-0000-0000-000000000006',
  null,
  1,
  -12.1504,
  -77.0174,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-10',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Reloj Garmin Forerunner 265 Music GPS',
  'Pantalla táctil AMOLED brillante, métricas de entrenamiento avanzadas, memoria para música de Spotify sin celular. Cable de carga incluido.',
  'Accesorios',
  'subasta',
  'active',
  115000,
  180000,
  100000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636174.76),
  to_timestamp(1795641474.76),
  'b0000000-0000-0000-0000-000000000006',
  null,
  2,
  -12.0969,
  -77.0359,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-11',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Cafetera Espresso De''Longhi Dedica Deluxe',
  '15 bares de presión profesional, boquilla panarello para texturizar leche. Descalcificada recientemente, incluye filtros simple y doble.',
  'Electrodomésticos',
  'subasta',
  'active',
  48000,
  89000,
  40000,
  2000,
  5000,
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795634174.76),
  to_timestamp(1795641674.76),
  'b0000000-0000-0000-0000-000000000008',
  null,
  1,
  -12.1373,
  -76.9926,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-12',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Silla Ergonómica Sihoo M57 Malla Transpirable',
  'Soporte lumbar 2D ajustable, brazos 3D, reclinación hasta 126 grados. Ideal para home office extensivo en Lima. Perfecto estado.',
  'Muebles',
  'subasta',
  'active',
  52000,
  98000,
  45000,
  3000,
  5000,
  'https://images.unsplash.com/photo-1580481077194-43cb790d9847?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795632174.76),
  to_timestamp(1795641594.76),
  'b0000000-0000-0000-0000-000000000008',
  null,
  1,
  -12.0801,
  -77.0369,
  'Lince, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-13',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Auriculares Sony WH-1000XM5 Cancelación de Ruido',
  'Líderes en cancelación de ruido activa, 30 horas de batería. Almohadillas suaves en cuero sintético, estuche rígido y cable de 3.5mm.',
  'Tecnología',
  'subasta',
  'active',
  88000,
  145000,
  75000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637174.76),
  to_timestamp(1795641374.76),
  'b0000000-0000-0000-0000-000000000001',
  null,
  2,
  -12.1179,
  -77.0286,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-14',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Lente Sigma 24-70mm f/2.8 DG DN Art para Sony E',
  'Óptica profesional nítida de esquina a esquina, apertura constante f/2.8. Cristales sin hongos ni rayas, incluye parasol y tapas.',
  'Fotografía',
  'subasta',
  'active',
  280000,
  420000,
  250000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795632674.76),
  to_timestamp(1795641824.76),
  'b0000000-0000-0000-0000-000000000004',
  null,
  1,
  -12.1421,
  -76.9986,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-15',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Monitor Gamer LG UltraGear 27'''' QHD 165Hz IPS',
  'Resolución 2560x1440, 1ms GtG, compatible con G-Sync y FreeSync Premium. Cero píxeles muertos, base ajustable en altura y pivote.',
  'Laptops',
  'subasta',
  'active',
  85000,
  135000,
  70000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635374.76),
  to_timestamp(1795641554.76),
  'b0000000-0000-0000-0000-000000000005',
  null,
  1,
  -12.0993,
  -77.0347,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-prog-01',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Mac Studio M2 Max 32GB RAM 512GB SSD',
  'Estación de trabajo ultra potente para renderizado 3D y edición 4K ProRes. Como nueva en caja original.',
  'Laptops',
  'subasta',
  'active',
  540000,
  780000,
  500000,
  15000,
  5000,
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795641174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1504,
  -77.0174,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-prog-02',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Samsung Galaxy S24 Ultra 256GB Titanium Gray',
  'S-Pen integrado, cámara de 200MP con zoom espacial 100x. Sellado en caja con boleta de compra.',
  'Celulares',
  'subasta',
  'active',
  330000,
  480000,
  300000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795641174.76),
  to_timestamp(1795731174.76),
  null,
  null,
  0,
  -12.0886,
  -77.0019,
  'San Borja, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-prog-03',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Amplificador de Guitarra Fender Blues Junior IV',
  '15 watts a tubos con parlante Celestion A-Type de 12 pulgadas. Tono cálido clásico, reverb de resortes mejorada.',
  'Música',
  'subasta',
  'active',
  190000,
  290000,
  170000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795641174.76),
  to_timestamp(1795736174.76),
  null,
  null,
  0,
  -12.0748,
  -77.0626,
  'Pueblo Libre, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-prog-04',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Dron DJI Mini 4 Pro Fly More Combo Plus',
  'Menos de 249g, sensores omnidireccionales de obstáculos, grabación vertical 4K/60fps HDR. Incluye 3 baterías Plus y control RC2.',
  'Fotografía',
  'subasta',
  'active',
  310000,
  460000,
  280000,
  10000,
  5000,
  'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795641174.76),
  to_timestamp(1795741174.76),
  null,
  null,
  0,
  -12.1191,
  -77.0322,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-prog-05',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Casaca de Plumas The North Face Nuptse 1996 Retro Talla L',
  'Relleno de pluma de ganso 700 cuin, tejido ripstop con acabado hidrófugo duradero. Color negro clásico, 100% original.',
  'Ropa',
  'subasta',
  'active',
  65000,
  110000,
  55000,
  3000,
  5000,
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795641174.76),
  to_timestamp(1795749174.76),
  null,
  null,
  0,
  -12.0933,
  -77.0335,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-end-01',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Apple Watch Ultra 2 GPS + Cellular 49mm Titanio',
  'Caja de titanio de grado aeroespacial, correa Trail Loop azul. Resistencia al agua 100m y GPS de doble frecuencia.',
  'Accesorios',
  'subasta',
  'closed',
  245000,
  380000,
  210000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795554774.76),
  to_timestamp(1795637574.76),
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  2,
  -12.1421,
  -76.9986,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-end-02',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Teclado Mecánico Custom Keychron Q1 Pro Wireless',
  'Cuerpo de aluminio CNC mecanizado, switches Banana lubricados artesanalmente, keycaps PBT doubleshot.',
  'Tecnología',
  'subasta',
  'closed',
  62000,
  95000,
  50000,
  3000,
  5000,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795551174.76),
  to_timestamp(1795633974.76),
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000005',
  1,
  -12.0804,
  -77.089,
  'San Miguel, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-end-03',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Gafas de Sol Ray-Ban Aviator Classic Polarizadas',
  'Montura dorada clásica con cristales verdes G-15 polarizados. 100% protección UV400, incluye estuche de cuero.',
  'Accesorios',
  'subasta',
  'closed',
  36000,
  68000,
  30000,
  2000,
  5000,
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795561174.76),
  to_timestamp(1795623174.76),
  'b0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000006',
  1,
  -12.1227,
  -77.0262,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-end-04',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Micrófono Shure SM7B Vocal Dinámico',
  'El estándar de la industria para podcast y streaming. Blindaje electromagnético de rechazo a zumbidos, cápsula impecable.',
  'Música',
  'subasta',
  'closed',
  110000,
  170000,
  95000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795566174.76),
  to_timestamp(1795629174.76),
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000003',
  1,
  -12.1492,
  -77.0222,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-sub-end-05',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Lente Sony FE 85mm f/1.8 para Retratos',
  'Nitidez excepcional y bokeh suave para retratos profesionales. Enfoque automático rápido y silencioso con botón programable.',
  'Fotografía',
  'subasta',
  'closed',
  145000,
  220000,
  130000,
  5000,
  5000,
  'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795556174.76),
  to_timestamp(1795626174.76),
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000004',
  1,
  -12.0848,
  -76.9356,
  'La Molina, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-01',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'iPhone 14 128GB - Medianoche Batería 94%',
  'Pantalla Super Retina XDR de 6.1 pulgadas, modo Cine en 4K. Incluye mica Spigen puesta y funda magsafe de silicona.',
  'Celulares',
  'remate',
  'active',
  185000,
  290000,
  140000,
  2500,
  5000,
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640574.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0945,
  -77.0371,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-02',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'PlayStation Portal Remote Player para PS5',
  'Pantalla LCD de 8 pulgadas a 1080p 60fps con toda la retroalimentación háptica y gatillos adaptativos del DualSense.',
  'Videojuegos',
  'remate',
  'active',
  78000,
  115000,
  60000,
  1500,
  5000,
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640274.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1179,
  -77.0286,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-03',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Parlante Portátil Marshall Emberton II Bluetooth',
  'Sonido estéreo multidireccional 360°, más de 30 horas de reproducción portátil, resistente al agua y polvo IP67.',
  'Música',
  'remate',
  'active',
  49000,
  78000,
  38000,
  1000,
  5000,
  'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640874.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1528,
  -77.0246,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-04',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Estabilizador Gimbal DJI Osmo Mobile 6 para Smartphone',
  'Brazo extensible integrado, seguimiento inteligente ActiveTrack 6.0, diseño magnético plegable súper portátil.',
  'Fotografía',
  'remate',
  'active',
  42000,
  69000,
  32000,
  1000,
  5000,
  'https://images.unsplash.com/photo-1589872584166-7e3e78f92110?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640724.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1409,
  -76.995,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-05',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Zapatillas Adidas Samba OG Blancas Talla 41',
  'Silueta clásica atemporal en cuero suave con puntera en T de ante. Condición 9/10, suela de goma caramelo.',
  'Zapatillas',
  'remate',
  'active',
  31000,
  48000,
  24000,
  800,
  5000,
  'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640424.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0898,
  -76.9971,
  'San Borja, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-06',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Monitor Portátil ASUS ZenScreen 15.6'''' Full HD USB-C',
  'Panel IPS antireflejos ultra delgado (780g). Conexión mediante un solo cable USB-C híbrido con funda plegable tipo atril.',
  'Laptops',
  'remate',
  'active',
  58000,
  92000,
  44000,
  1500,
  5000,
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0725,
  -77.0506,
  'Jesús María, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-07',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Freidora de Aire Philips Essential Airfryer XL 4.1L',
  'Tecnología Rapid Air para freír con hasta 90% menos grasa. Canasta antiadherente desmontable lavable en lavavajillas.',
  'Electrodomésticos',
  'remate',
  'active',
  29000,
  48000,
  21000,
  800,
  5000,
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640774.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0898,
  -77.0676,
  'Magdalena, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-08',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Mochila Antirrobo Bobby Hero Regular 18L',
  'Cremalleras ocultas y bolsillos con protección RFID, tejido resistente a cortes, puerto de carga USB integrado.',
  'Accesorios',
  'remate',
  'active',
  24000,
  39000,
  17000,
  600,
  5000,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640524.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0801,
  -77.0369,
  'Lince, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-09',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Pedal de Efectos Strymon Iridium Amp & IR Cab',
  'Modelador de amplificadores a bulbos icónicos (Fender Deluxe, Vox AC30, Marshall Plexi) con 9 respuestas a impulsos estéreo.',
  'Música',
  'remate',
  'active',
  125000,
  185000,
  98000,
  3000,
  5000,
  'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640824.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0724,
  -77.0638,
  'Pueblo Libre, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-rem-10',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Mesa de Centro Escandinava Madera de Roble',
  'Diseño minimalista con patas cónicas en roble macizo y bandeja inferior para revistas. Dimensiones 100x50x45cm.',
  'Muebles',
  'remate',
  'active',
  38000,
  65000,
  28000,
  1000,
  5000,
  'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640624.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0816,
  -77.0926,
  'San Miguel, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-01',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'AirPods Pro 2da Generación USB-C con Estuche MagSafe',
  'Cancelación activa de ruido 2x superior, audio adaptativo y modo ambiente. Como nuevos en caja original.',
  'Tecnología',
  'normal',
  'active',
  79000,
  110000,
  79000,
  0,
  5000,
  'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795640374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1239,
  -77.0298,
  'Miraflores, Lima',
  'approximate',
  true
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-02',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Laptop ASUS ROG Zephyrus G14 Ryzen 9 RTX 4060',
  'Pantalla ROG Nebula 165Hz QHD, 16GB DDR5, 1TB SSD NVMe. Teclado retroiluminado RGB, chasis de magnesio ligero (1.65kg).',
  'Laptops',
  'normal',
  'active',
  480000,
  690000,
  480000,
  0,
  5000,
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795639974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0981,
  -77.0311,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-03',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Google Pixel 8 128GB Hazel - Desbloqueado',
  'Procesador Google Tensor G3, fotografía computacional líder y 7 años de actualizaciones Android garantizadas.',
  'Celulares',
  'normal',
  'active',
  195000,
  280000,
  195000,
  0,
  5000,
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795639674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1492,
  -77.0222,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-04',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Trípode de Carbono Manfrotto Befree Advanced Twist',
  'Estructura de fibra de carbono ultra liviana (1.25kg), rótula de bola con zapata rápida 200PL-PRO. Carga hasta 9kg.',
  'Fotografía',
  'normal',
  'active',
  72000,
  110000,
  72000,
  0,
  5000,
  'https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795639174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1373,
  -76.9926,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-05',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Mando Inalámbrico Xbox Elite Series 2 Core Blanco',
  'Palancas de mando con tensión ajustable, empuñadura envolvente de goma, bloqueos de gatillo de alta sensibilidad.',
  'Videojuegos',
  'normal',
  'active',
  43000,
  65000,
  43000,
  0,
  5000,
  'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795639374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0862,
  -77.0031,
  'San Borja, Lima',
  'approximate',
  true
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-06',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Ukelele Concierto Kala KA-C Caoba Satinada',
  'Cuerpo de caoba con ribete blanco tradicional, cuerdas Aquila Super Nylgut. Sonido dulce y resonante, funda incluida.',
  'Música',
  'normal',
  'active',
  26000,
  42000,
  26000,
  0,
  5000,
  'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795638674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0689,
  -77.0482,
  'Jesús María, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-07',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Zapatillas New Balance 550 Blanco con Verde Talla 42.5',
  'Homenaje a los jugadores profesionales de básquetbol de los 90. Cuero prémium perforado, 100% originales en caja.',
  'Zapatillas',
  'normal',
  'active',
  36000,
  52000,
  36000,
  0,
  5000,
  'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795638174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1251,
  -77.0334,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-08',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Kindle Paperwhite 11va Gen 16GB Pantalla 6.8'''' Calma',
  'Luz cálida regulable, hasta 10 semanas de batería, pantalla de 300 ppp sin reflejos y resistencia al agua IPX8.',
  'Tecnología',
  'normal',
  'active',
  49000,
  69000,
  49000,
  0,
  5000,
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0993,
  -77.0347,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-09',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Aspiradora Robot Xiaomi Robot Vacuum S10+',
  'Navegación láser LDS, doble mopa giratoria a presión, succión potente de 4000Pa y mapeo multinivel en app Xiaomi Home.',
  'Electrodomésticos',
  'normal',
  'active',
  89000,
  135000,
  89000,
  0,
  5000,
  'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1504,
  -77.0174,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-10',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Polera Oversize Essentials Fear of God Talla M',
  'Algodón pesado 380g, corte holgado contemporáneo con logo engomado en espalda. Color gris melange original.',
  'Ropa',
  'normal',
  'active',
  32000,
  55000,
  32000,
  0,
  5000,
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1385,
  -76.9962,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-11',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Bicicleta Urbana Fixie Rodado 28 Cuadro Acero Cromado',
  'Maza flip-flop (piñón fijo y libre), frenos Promax delantero y trasero, aros de doble pared aerodinámicos. Muy ágil en ciclovías de Lima.',
  'Deportes',
  'normal',
  'active',
  75000,
  120000,
  75000,
  0,
  5000,
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795637174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0898,
  -77.0676,
  'Magdalena, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-12',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Lámpara de Pie Nórdica Minimalista LED Regulable',
  'Estructura de hierro negro satinado y cabezal orientable con interruptor táctil y 3 temperaturas de color (cálida, neutra y fría).',
  'Muebles',
  'normal',
  'active',
  19000,
  32000,
  19000,
  0,
  5000,
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0801,
  -77.0369,
  'Lince, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-13',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Consola Portátil Steam Deck 512GB NVMe con Pantalla Anti-glare',
  'Pantalla de cristal grabado al ácido, estuche exclusivo de transporte y cargador rápido original de 45W. SteamOS actualizado.',
  'Videojuegos',
  'normal',
  'active',
  195000,
  280000,
  195000,
  0,
  5000,
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0824,
  -76.9368,
  'La Molina, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-14',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Reloj Seiko 5 Sports Automático Esfera Negra',
  'Movimiento automático calibre 4R36 con 41 horas de reserva de marcha, cristal Hardlex, resistencia al agua 100m. Con eslabones extra.',
  'Accesorios',
  'normal',
  'active',
  68000,
  105000,
  68000,
  0,
  5000,
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.05,
  -77.0341,
  'Cercado de Lima, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-15',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Micrófono USB Rode NT-USB Mini con Filtro Anti-pop',
  'Calidad de estudio profesional en formato compacto. Base magnética desmontable resistente a vibraciones y salida de audífonos sin latencia.',
  'Música',
  'normal',
  'active',
  34000,
  52000,
  34000,
  0,
  5000,
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795636174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1239,
  -77.0298,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-16',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Gimbal Zhiyun Crane M2S Combo con Luz de Relleno',
  'Compatible con cámaras mirrorless compactas, cámaras de acción y smartphones. Luz LED bicolor ultra potente de 1000 lúmenes integrada.',
  'Fotografía',
  'normal',
  'active',
  68000,
  105000,
  68000,
  0,
  5000,
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0981,
  -77.0311,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-17',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Jean Levi''s 501 Original Fit Azul Stonewash Talla 32x32',
  'El clásico de botones original de 1873 en denim de algodón 100%. Sin rasgaduras ni desgaste artificial, excelente estado.',
  'Ropa',
  'normal',
  'active',
  18000,
  29900,
  18000,
  0,
  5000,
  'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1385,
  -76.9962,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-18',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Apple Magic Keyboard con Touch ID para Mac',
  'Distribución en español latino con ñ. Sensor Touch ID ultra rápido para desbloqueo y compras seguras con Apple Pay.',
  'Tecnología',
  'normal',
  'active',
  45000,
  72000,
  45000,
  0,
  5000,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.148,
  -77.0186,
  'Barranco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-19',
  'a0000000-0000-0000-0000-000000000002',
  'Camila Paredes',
  true,
  'Plancha Vertical de Vapor Philips ComfortTouch Plus',
  'Cabezal FlexHead para planchar la parte inferior sin agacharse, tabla extralarga y 5 niveles de vapor continuo para telas delicadas.',
  'Electrodomésticos',
  'normal',
  'active',
  32000,
  59000,
  32000,
  0,
  5000,
  'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795635174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0862,
  -77.0031,
  'San Borja, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-20',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Tapete de Yoga Lululemon 5mm Reversible Antideslizante',
  'Capa superior de poliuretano que absorbe el sudor para un agarre inmejorable incluso en sesiones de hot yoga. Muy poco uso.',
  'Deportes',
  'normal',
  'active',
  21000,
  38000,
  21000,
  0,
  5000,
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795634974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0689,
  -77.0482,
  'Jesús María, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-21',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Mouse Ergonómico Logitech MX Master 3S Grafito',
  'Sensor Darkfield de 8000 DPI que funciona incluso sobre cristal, clics silenciosos al 90% y rueda electromagnética MagSpeed.',
  'Accesorios',
  'normal',
  'active',
  29000,
  45000,
  29000,
  0,
  5000,
  'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795634674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1251,
  -77.0334,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-22',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Casco para Ciclismo Giro Agilis MIPS Talla M',
  'Sistema de protección cerebral multidireccional MIPS, 32 aberturas de ventilación Wind Tunnel, ajuste Roc Loc 5.5.',
  'Deportes',
  'normal',
  'active',
  26000,
  42000,
  26000,
  0,
  5000,
  'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795634374.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0993,
  -77.0347,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-23',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Estante Librero Modular Estilo Industrial 5 Niveles',
  'Estructura de tubo de acero negro y repisas de madera melamina tono nogal oscuro. Desmontable para fácil transporte en Lima.',
  'Muebles',
  'normal',
  'active',
  34000,
  58000,
  34000,
  0,
  5000,
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795634174.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1397,
  -76.9914,
  'Surco, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-24',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Proyector Portátil Anker Nebula Capsule II Android TV',
  'Tamaño similar a una lata de refresco, proyección HD 720p de hasta 100 pulgadas, altavoz de 8W con tecnología de radiador pasivo.',
  'Tecnología',
  'normal',
  'active',
  110000,
  175000,
  110000,
  0,
  5000,
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795633974.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.1215,
  -77.031,
  'Miraflores, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

insert into public.products (
  id, seller_id, seller_name, seller_verified, title, description, category,
  mode, status, price_cents, original_cents, floor_cents, step_cents, increment_cents,
  image_path, created_at, end_at, leader_id, winner_id, bid_count,
  latitude, longitude, location_label, location_visibility, is_live
) values (
  'prod-dir-25',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Lente Gran Angular Sony FE 20mm f/1.8 G para Astrofotografía',
  'Diseño compacto y ligero (373g) con dos elementos asféricos avanzados (AA). Anillo de apertura con clic conmutable para vídeo.',
  'Fotografía',
  'normal',
  'active',
  235000,
  340000,
  235000,
  0,
  5000,
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
  to_timestamp(1795633674.76),
  to_timestamp(1795727574.76),
  null,
  null,
  0,
  -12.0957,
  -77.0323,
  'San Isidro, Lima',
  'approximate',
  false
) on conflict (id) do update set
  price_cents = excluded.price_cents,
  status = excluded.status,
  leader_id = excluded.leader_id,
  winner_id = excluded.winner_id,
  bid_count = excluded.bid_count,
  end_at = excluded.end_at,
  is_live = excluded.is_live;

-- 3. PUJAS HISTÓRICAS
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-01', 'b0000000-0000-0000-0000-000000000002', 115000, to_timestamp(1795641114.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-01', 'b0000000-0000-0000-0000-000000000001', 110000, to_timestamp(1795640994.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-01', 'b0000000-0000-0000-0000-000000000007', 105000, to_timestamp(1795640874.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-02', 'b0000000-0000-0000-0000-000000000004', 275000, to_timestamp(1795641054.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-02', 'b0000000-0000-0000-0000-000000000002', 270000, to_timestamp(1795640934.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-03', 'b0000000-0000-0000-0000-000000000005', 185000, to_timestamp(1795641129.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-03', 'b0000000-0000-0000-0000-000000000009', 180000, to_timestamp(1795641064.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-04', 'b0000000-0000-0000-0000-000000000009', 360000, to_timestamp(1795641024.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-04', 'b0000000-0000-0000-0000-000000000004', 350000, to_timestamp(1795640854.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-05', 'b0000000-0000-0000-0000-000000000003', 55000, to_timestamp(1795641084.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-05', 'b0000000-0000-0000-0000-000000000002', 50000, to_timestamp(1795640954.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-06', 'b0000000-0000-0000-0000-000000000007', 320000, to_timestamp(1795641094.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-07', 'b0000000-0000-0000-0000-000000000005', 38000, to_timestamp(1795641104.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-07', 'b0000000-0000-0000-0000-000000000001', 36000, to_timestamp(1795640984.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-08', 'b0000000-0000-0000-0000-000000000002', 110000, to_timestamp(1795641074.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-09', 'b0000000-0000-0000-0000-000000000006', 290000, to_timestamp(1795641044.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-10', 'b0000000-0000-0000-0000-000000000006', 115000, to_timestamp(1795641134.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-10', 'b0000000-0000-0000-0000-000000000007', 110000, to_timestamp(1795641024.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-11', 'b0000000-0000-0000-0000-000000000008', 48000, to_timestamp(1795641064.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-12', 'b0000000-0000-0000-0000-000000000008', 52000, to_timestamp(1795641079.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-13', 'b0000000-0000-0000-0000-000000000001', 88000, to_timestamp(1795641139.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-13', 'b0000000-0000-0000-0000-000000000003', 83000, to_timestamp(1795641024.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-14', 'b0000000-0000-0000-0000-000000000004', 280000, to_timestamp(1795641044.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-15', 'b0000000-0000-0000-0000-000000000005', 85000, to_timestamp(1795641089.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-01', 'b0000000-0000-0000-0000-000000000001', 245000, to_timestamp(1795637474.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-01', 'b0000000-0000-0000-0000-000000000002', 240000, to_timestamp(1795637174.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-02', 'b0000000-0000-0000-0000-000000000005', 62000, to_timestamp(1795633674.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-03', 'b0000000-0000-0000-0000-000000000006', 36000, to_timestamp(1795622174.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-04', 'b0000000-0000-0000-0000-000000000003', 110000, to_timestamp(1795628674.76));
insert into public.bids (product_id, bidder_id, amount_cents, created_at)
values ('prod-sub-end-05', 'b0000000-0000-0000-0000-000000000004', 145000, to_timestamp(1795625674.76));

-- 4. TRANSMISIONES FLASH LIVE

insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Diego Rodríguez',
  true,
  'Especial Apple & Tech: MacBook Air M1 e iPad Pro en Vivo',
  'Demostración de rendimiento de batería, pruebas de audio y subastas activas desde Miraflores.',
  array['prod-sub-01','prod-sub-06','prod-dir-01']::text[],
  'prod-sub-01',
  'live',
  38,
  to_timestamp(1795639374.76),
  to_timestamp(1795639974.76),
  null
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;

insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000005',
  'Mateo Quispe',
  false,
  'Gamer Zone Lima: PS5 Slim y Mandos DualSense en Acción',
  'Probando consolas en pantalla gigante y respondiendo dudas técnicas antes de las pujas.',
  array['prod-sub-03','prod-sub-08','prod-dir-05']::text[],
  'prod-sub-03',
  'live',
  29,
  to_timestamp(1795639674.76),
  to_timestamp(1795640274.76),
  null
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;

insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000006',
  'Valeria Flores',
  true,
  'Sneakers & Streetwear: Unboxing de Dunks y Prendas de Colección',
  'Mostrando detalles de costuras, tallaje real y combinaciones urbanas exclusivas.',
  array['prod-sub-07','prod-dir-07','prod-dir-10']::text[],
  'prod-sub-07',
  'scheduled',
  0,
  to_timestamp(1795637574.76),
  to_timestamp(1795644774.76),
  null
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;

insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  'c0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  'Lucía Vega',
  true,
  'Estudio Fotográfico: Sony A7 III y Ópticas Sigma en Directo',
  'Enfoque al ojo en tiempo real, pruebas de diafragma y accesorios para creadores.',
  array['prod-sub-04','prod-sub-14','prod-dir-04']::text[],
  'prod-sub-04',
  'scheduled',
  0,
  to_timestamp(1795633974.76),
  to_timestamp(1795648374.76),
  null
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;

insert into public.live_streams (
  id, seller_id, seller_name, seller_verified, title, description,
  product_ids, active_product_id, status, viewer_count, created_at, started_at, ended_at
) values (
  'c0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000003',
  'Andrés Mendoza',
  true,
  'Acústica Barranquina: Guitarras Fender y Pedales Strymon',
  'Sesión musical en vivo y subasta de guitarra electroacústica finalizada con éxito.',
  array['prod-sub-05','prod-rem-03','prod-dir-06']::text[],
  'prod-sub-05',
  'ended',
  14,
  to_timestamp(1795630374.76),
  to_timestamp(1795633974.76),
  to_timestamp(1795639374.76)
) on conflict (id) do update set
  status = excluded.status,
  viewer_count = excluded.viewer_count,
  active_product_id = excluded.active_product_id;

-- 5. MENSAJES DE CHAT PÚBLICO FLASH LIVE
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Marta Castillo', false, '¡Hola Diego! ¿La MacBook Air incluye el cargador original de Apple?', to_timestamp(1795640224.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Diego Rodríguez', true, '¡Hola Marta! Sí, viene con su caja original, manuales y cargador oficial de 30W.', to_timestamp(1795640324.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Carlos Ramos', false, 'Pujé S/ 1,150. ¿Coordinas entregas hoy mismo por Miraflores?', to_timestamp(1795641114.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Diego Rodríguez', true, '¡Claro Carlos! Apenas cierre la subasta coordinamos por el chat privado para entrega segura.', to_timestamp(1795641144.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Javier Salazar', false, '¿Los 2 mandos tienen drift o están al 100%?', to_timestamp(1795640674.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Mateo Quispe', true, 'Cero drift Javier, los probé en pantalla hace unos minutos en el directo.', to_timestamp(1795640774.76));
insert into public.live_messages (stream_id, sender_id, sender_name, is_seller, text, created_at)
values ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 'Rodrigo Herrera', false, 'Acabo de subir la puja a S/ 1,850.', to_timestamp(1795641129.76));

-- 6. ÓRDENES Y CHAT POSTVENTA

insert into public.orders (
  id, buyer_id, seller_id, title, price_cents, fee_cents, status, provider, real_funds_held, created_at, received_at
) values (
  'prod-sub-end-01',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Apple Watch Ultra 2 GPS + Cellular 49mm Titanio',
  245000,
  9800,
  'completed',
  'demo',
  false,
  now() - interval '2 hours',
  now()
) on conflict (id) do update set
  status = excluded.status,
  received_at = excluded.received_at;
insert into public.messages (order_id, sender_id, text, created_at)
values ('prod-sub-end-01', 'b0000000-0000-0000-0000-000000000001', '¡Hola Diego! Qué buena subasta. ¿Podemos coordinar para encontrarnos en Larcomar a las 4pm?', to_timestamp(1795637674.76));
insert into public.messages (order_id, sender_id, text, created_at)
values ('prod-sub-end-01', 'a0000000-0000-0000-0000-000000000001', '¡Hola Marta! Perfecto, estaré cerca de la cafetería con el estuche y accesorios listos.', to_timestamp(1795637974.76));
insert into public.messages (order_id, sender_id, text, created_at)
values ('prod-sub-end-01', 'b0000000-0000-0000-0000-000000000001', 'Excelente reloj, ya lo revisé y confirmé la recepción en el sistema. ¡Gracias!', to_timestamp(1795639374.76));

insert into public.orders (
  id, buyer_id, seller_id, title, price_cents, fee_cents, status, provider, real_funds_held, created_at, received_at
) values (
  'prod-sub-end-02',
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000005',
  'Teclado Mecánico Custom Keychron Q1 Pro Wireless',
  62000,
  2480,
  'delivery_pending',
  'demo',
  false,
  now() - interval '2 hours',
  null
) on conflict (id) do update set
  status = excluded.status,
  received_at = excluded.received_at;
insert into public.messages (order_id, sender_id, text, created_at)
values ('prod-sub-end-02', 'b0000000-0000-0000-0000-000000000005', 'Hola Mateo, gané la subasta. ¿Haces entregas en el centro comercial La Rambla de San Borja?', to_timestamp(1795634174.76));
insert into public.messages (order_id, sender_id, text, created_at)
values ('prod-sub-end-02', 'a0000000-0000-0000-0000-000000000005', '¡Hola Javier! Sí, vivo a unas cuadras. ¿Te parece hoy a las 6:30pm?', to_timestamp(1795634674.76));

-- 7. FAVORITOS DE EJEMPLO
insert into public.favorites (user_id, product_id)
values
  ('b0000000-0000-0000-0000-000000000001', 'prod-sub-01'),
  ('b0000000-0000-0000-0000-000000000001', 'prod-dir-01'),
  ('b0000000-0000-0000-0000-000000000002', 'prod-sub-02'),
  ('b0000000-0000-0000-0000-000000000002', 'prod-rem-01')
on conflict do nothing;
