import { UserFacingError } from "./errors";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const backend = import.meta.env.VITE_BACKEND || "supabase";
let client: SupabaseClient | undefined;
export function supabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new UserFacingError("La conexión de la página aún no está configurada. Contacta con el administrador para habilitarla.");
  if (key.startsWith("sb_secret_")) throw new UserFacingError("La configuración de acceso no es válida. El administrador debe revisarla.");
  // Legacy JWT keys must carry the anon role, never service_role.
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role !== "anon") throw new UserFacingError();
    } catch { throw new UserFacingError("La configuración de acceso no es válida. El administrador debe revisarla."); }
  }
  client = createClient(url, key);
  return client;
}
