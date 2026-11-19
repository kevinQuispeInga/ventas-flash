import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

test("UNIFICACIÓN: Configuración de entorno local apunta a Firebase como backend principal", () => {
  const envLocal = fs.readFileSync(".env.local", "utf8");
  assert.ok(
    envLocal.includes("VITE_BACKEND=firebase"),
    ".env.local debe configurar VITE_BACKEND=firebase"
  );
  assert.ok(
    envLocal.includes("VITE_USE_FIREBASE_EMULATORS=true"),
    ".env.local debe activar emuladores locales"
  );
});

test("UNIFICACIÓN: ./emulator-data contiene datos persistentes exportados de Auth y Firestore", () => {
  const metaPath = path.resolve("./emulator-data/firebase-export-metadata.json");
  assert.ok(fs.existsSync(metaPath), "Debe existir firebase-export-metadata.json");

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  assert.ok(meta.firestore, "Metadata debe incluir firestore");
  assert.ok(meta.auth, "Metadata debe incluir auth");

  // Verificar accounts.json en auth_export
  const accountsPath = path.resolve("./emulator-data/auth_export/accounts.json");
  assert.ok(fs.existsSync(accountsPath), "Debe existir accounts.json en auth_export");
  const accountsData = JSON.parse(fs.readFileSync(accountsPath, "utf8"));
  const users = accountsData.users || [];
  assert.equal(users.length, 15, "Deben existir 15 usuarios exportados en Authentication");

  const emails = users.map((u) => u.email);
  assert.ok(emails.includes("diego.vendedor@ventasflash.pe"), "Vendedor Diego debe existir en Auth");
  assert.ok(emails.includes("carlos.comprador@ventasflash.pe"), "Comprador Carlos debe existir en Auth");
  assert.ok(emails.includes("camila.vendedora@ventasflash.pe"), "Vendedora Camila debe existir en Auth");
  assert.ok(emails.includes("marta.compradora@ventasflash.pe"), "Compradora Marta debe existir en Auth");
});

test("UNIFICACIÓN: scripts de inicio único existen y están configurados", () => {
  assert.ok(fs.existsSync("iniciar-todo.ps1"), "iniciar-todo.ps1 debe existir");
  assert.ok(fs.existsSync("scripts/start-all.mjs"), "scripts/start-all.mjs debe existir");
  assert.ok(fs.existsSync("scripts/export-data.mjs"), "scripts/export-data.mjs debe existir");

  const ps1 = fs.readFileSync("iniciar-todo.ps1", "utf8");
  assert.ok(ps1.includes("VITE_BACKEND=firebase"), "Script PowerShell debe configurar backend Firebase");
  assert.ok(ps1.includes("8080"), "Script PowerShell debe verificar puerto de Firestore");
  assert.ok(ps1.includes("9099"), "Script PowerShell debe verificar puerto de Auth");
});

test("UNIFICACIÓN: eliminación de selectores de modo en la interfaz principal", () => {
  const mainTsx = fs.readFileSync("src/main.tsx", "utf8");
  assert.ok(
    !mainTsx.includes('className="backend-banner"'),
    "No debe existir el banner divisor de modos en main.tsx"
  );
  assert.ok(
    !mainTsx.includes("Modo DEMO · datos locales"),
    "No debe mostrar texto de alternancia de modos para usuarios normales"
  );
  assert.ok(
    !mainTsx.includes("Entrar como Marta"),
    "La pantalla de autenticación no debe tener bypass decorativo en producción"
  );
});
