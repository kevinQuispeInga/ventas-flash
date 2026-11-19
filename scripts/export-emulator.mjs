#!/usr/bin/env node
/**
 * Exporta el estado actual de los emuladores locales a ./emulator-data
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";

const targetDir = path.resolve("./emulator-data");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log("💾 Exportando datos de Firebase Emulator Suite a ./emulator-data...");
try {
  execSync(
    'npx firebase emulators:export ./emulator-data --project demo-ventas-flash --force',
    { stdio: "inherit", env: { ...process.env } }
  );
  console.log("✅ Datos exportados exitosamente.");
} catch (err) {
  console.error("❌ Error exportando datos:", err.message);
  process.exit(1);
}
