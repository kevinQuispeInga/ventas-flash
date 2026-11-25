-- =====================================================================
-- FIX: CORRECCIÓN DE CAMPOS VACÍOS EN AUTH.USERS (GOTRUE GO DRIVER)
-- En Supabase GoTrue, el backend de autenticación en Go intenta escanear
-- columnas de texto como strings sin permitir NULL en tokens de recuperación y cambio.
-- =====================================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, false),
  is_anonymous = COALESCE(is_anonymous, false)
WHERE email LIKE '%@ventasflash.pe';
