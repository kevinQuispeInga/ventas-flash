import { backend } from "../lib/firebase";
import { DemoService } from "./demo";
import { FirebaseService } from "./firebase";
import type { MarketplaceService } from "./contracts";
let instance: MarketplaceService;
export function getService() {
  if (!instance) {
    if (backend === "demo") instance = new DemoService();
    else if (backend === "firebase") instance = new FirebaseService();
    else throw new Error("VITE_BACKEND debe ser demo o firebase.");
  }
  return instance;
}
