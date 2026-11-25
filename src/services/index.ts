import { UserFacingError } from "../lib/errors";
import { backend } from "../lib/supabase";
import { DemoService } from "./demo";
import { SupabaseService } from "./supabase";
import type { MarketplaceService } from "./contracts";
let instance: MarketplaceService;
export function getService() {
  if (!instance) {
    if (backend === "demo") instance = new DemoService();
    else if (backend === "supabase") instance = new SupabaseService();
    else throw new UserFacingError("La conexión de la página no está configurada correctamente. Contacta con el administrador.");
  }
  return instance;
}
