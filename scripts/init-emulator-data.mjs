#!/usr/bin/env node
/**
 * Inicializa y exporta ./emulator-data de forma garantizada y limpia.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";

process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";

// 1. Limpiar hub temporal obsoleto
const hubFile = path.join(os.tmpdir(), "hub-demo-ventas-flash.json");
if (fs.existsSync(hubFile)) {
  try { fs.unlinkSync(hubFile); } catch {}
}

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

function checkPort(port, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout }, () => resolve(true));
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

async function waitFor(port, label, max = 30) {
  for (let i = 0; i < max; i++) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function run() {
  console.log("1. Verificando emuladores...");
  let emuProc = null;
  const running = await checkPort(8080);
  if (!running) {
    console.log("2. Arrancando emuladores de Firebase temporalmente...");
    emuProc = spawn(npmCmd, ["run", "emulators"], {
      stdio: "pipe",
      env: { ...process.env },
    });
    const ready = await waitFor(8080, "Firestore");
    if (!ready) {
      console.error("❌ Los emuladores no iniciaron a tiempo.");
      if (emuProc) emuProc.kill();
      process.exit(1);
    }
  }

  console.log("3. Ejecutando población SEED (15 usuarios, 60 productos, 5 streams, 2 órdenes)...");
  execSync("node scripts/seed-emulator.mjs", { stdio: "inherit", env: { ...process.env } });

  console.log("4. Exportando estado a ./emulator-data...");
  const targetDir = path.resolve("./emulator-data");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  execSync("npx firebase emulators:export ./emulator-data --project demo-ventas-flash --force", {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("✅ ./emulator-data generado y persistido exitosamente.");

  if (emuProc) {
    console.log("5. Deteniendo proceso temporal de emuladores...");
    emuProc.kill();
  }
}

run().catch((err) => {
  console.error("❌ Error inicializando emulator-data:", err.message);
  process.exit(1);
});
