#!/usr/bin/env node
/**
 * Exportador determinista y directo de emuladores para Ventas Flash en Windows.
 * Guarda Auth y Firestore en ./emulator-data de forma 100% compatible con
 * `firebase emulators:start --import=./emulator-data`.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const projectId = "demo-ventas-flash";
const exportDir = path.resolve("./emulator-data");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function exportAll() {
  console.log("💾 [EXPORT] Exportando datos de Firebase Emulators...");

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 1. Exportar Firestore
  console.log("1. Exportando Firestore...");
  const firestoreExportDir = path.join(exportDir, "firestore_export");
  if (fs.existsSync(firestoreExportDir)) {
    fs.rmSync(firestoreExportDir, { recursive: true, force: true });
  }

  const firestorePayload = JSON.stringify({
    database: `projects/${projectId}/databases/(default)`,
    export_directory: exportDir,
    export_name: "firestore_export",
  });

  await request(
    {
      hostname: "127.0.0.1",
      port: 8080,
      path: `/emulator/v1/projects/${projectId}:export`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(firestorePayload),
      },
    },
    firestorePayload
  );
  console.log("✅ Firestore exportado en ./emulator-data/firestore_export");

  // 2. Exportar Auth
  console.log("2. Exportando Authentication...");
  const authExportDir = path.join(exportDir, "auth_export");
  if (!fs.existsSync(authExportDir)) {
    fs.mkdirSync(authExportDir, { recursive: true });
  }

  const accountsJson = await request({
    hostname: "127.0.0.1",
    port: 9099,
    path: `/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?maxResults=-1`,
    method: "GET",
    headers: { Authorization: "Bearer owner" },
  });
  fs.writeFileSync(path.join(authExportDir, "accounts.json"), accountsJson, "utf8");

  const configJson = await request({
    hostname: "127.0.0.1",
    port: 9099,
    path: `/emulator/v1/projects/${projectId}/config`,
    method: "GET",
    headers: { Authorization: "Bearer owner" },
  });
  fs.writeFileSync(path.join(authExportDir, "config.json"), configJson, "utf8");
  console.log("✅ Authentication exportado en ./emulator-data/auth_export");

  // 3. Metadata general para que firebase emulators --import lo reconozca
  const metadata = {
    version: "15.37.0",
    firestore: {
      version: "1.19.8",
      path: "firestore_export",
      metadata_file: "firestore_export/firestore_export.overall_export_metadata",
    },
    auth: {
      version: "15.37.0",
      path: "auth_export",
    },
  };
  fs.writeFileSync(
    path.join(exportDir, "firebase-export-metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );
  console.log("✅ firebase-export-metadata.json creado exitosamente.");
  console.log("🎉 PERSISTENCIA COMPLETADA en ./emulator-data");
}

exportAll().catch((err) => {
  console.error("❌ Error exportando datos:", err.message);
  process.exit(1);
});
