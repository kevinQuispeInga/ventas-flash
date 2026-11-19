#!/usr/bin/env node
/**
 * Script de inicio unificado para Ventas Flash 🇵🇪
 *
 * Levanta en un solo comando:
 * 1. Firebase Emulator Suite (Auth, Firestore, Functions, Storage) con persistencia local
 *    de datos (--import=./emulator-data --export-on-exit=./emulator-data).
 * 2. Servidor de desarrollo Frontend (Vite) conectado directamente a los emuladores.
 *
 * RESTRICCIÓN ABSOLUTA: Costo S/ 0. No requiere conexión a internet ni servicios de pago.
 */

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";

const hubTemp = path.join(os.tmpdir(), "hub-demo-ventas-flash.json");
if (fs.existsSync(hubTemp)) {
  try { fs.unlinkSync(hubTemp); } catch {}
}

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

function checkPort(port, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout }, (res) => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForEmulators(maxAttempts = 45) {
  process.stdout.write("⏳ Esperando que Firebase Emulator Suite inicialice...");
  for (let i = 0; i < maxAttempts; i++) {
    const authReady = await checkPort(9099);
    const firestoreReady = await checkPort(8080);
    if (authReady && firestoreReady) {
      console.log("\n✅ Emuladores listos (Auth :9099, Firestore :8080, Functions :5001, Storage :9199).");
      return true;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("\n⚠️ Tiempo de espera agotado. Iniciando frontend de todos modos...");
  return false;
}

async function main() {
  console.log("=================================================================");
  console.log("🇵🇪  VENTAS FLASH - MARKETPLACE EN TIEMPO REAL (LIMA, PERÚ)  🇵🇪");
  console.log("=================================================================");
  console.log("Arquitectura: React + TypeScript + Firebase Emulator Suite (S/ 0)");
  console.log("Fuente única de datos: Firestore + Authentication + Storage");
  console.log("Persistencia: ./emulator-data (automática entre reinicios)");
  console.log("-----------------------------------------------------------------\n");

  const alreadyRunning = await checkPort(8080);
  let emulatorsProc = null;

  if (alreadyRunning) {
    console.log("ℹ️  Emuladores de Firebase ya detectados en ejecución.");
  } else {
    console.log("📦 Iniciando Firebase Emulator Suite con persistencia...");
    emulatorsProc = spawn(npmCmd, ["run", "emulators"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });

    emulatorsProc.on("error", (err) => {
      console.error("❌ Error al arrancar emuladores:", err.message);
    });

    await waitForEmulators();
  }

  console.log("\n⚡ Iniciando Vite Frontend...");
  const devProc = spawn(npmCmd, ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, VITE_BACKEND: "firebase", VITE_USE_FIREBASE_EMULATORS: "true" },
  });

  const cleanup = () => {
    console.log("\n🛑 Cerrando procesos de Ventas Flash...");
    if (devProc && !devProc.killed) devProc.kill();
    if (emulatorsProc && !emulatorsProc.killed) emulatorsProc.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("❌ Error en script de inicio:", err);
  process.exit(1);
});
