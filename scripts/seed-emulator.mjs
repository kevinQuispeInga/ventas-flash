#!/usr/bin/env node
/**
 * Script de población maestro (SEED) para Firebase Emulator Suite en Ventas Flash.
 *
 * Pobla de manera determinista e idempotente:
 * - 15 usuarios de prueba peruanos en Authentication y Firestore (6 vendedores, 9 compradores).
 * - 60 productos en 10 categorías en Firestore (25 normales, 25 subastas, 10 remates)
 *   distribuidos en 12 distritos de Lima con coordenadas de Radar Flash.
 * - 5 transmisiones Flash Live con mensajes de chat público.
 * - Órdenes de compra, custodia simulada (escrow), entregas y chat postventa bilateral.
 *
 * RESTRICCIÓN ABSOLUTA: Costo S/ 0. Solo opera contra emuladores locales de Firebase.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Configuración de variables de entorno para emuladores locales
process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const adminApp = require("firebase-admin/app");
const adminAuth = require("firebase-admin/auth");
const adminStore = require("firebase-admin/firestore");
const esbuild = require("esbuild");

// Carga en caliente del archivo TypeScript de datos semilla
const seedPath = fileURLToPath(new URL("../src/data/seedData.ts", import.meta.url));
const bundled = esbuild.buildSync({
  entryPoints: [seedPath],
  bundle: true,
  format: "esm",
  write: false,
});
const dataUrl =
  "data:text/javascript;base64," +
  Buffer.from(bundled.outputFiles[0].text).toString("base64");
const {
  SEED_USERS,
  DEFAULT_TEST_PASSWORD,
  getSeedProducts,
  getSeedLiveStreams,
  getSeedLiveMessages,
  getSeedOrders,
} = await import(dataUrl);

const projectId = process.env.GCLOUD_PROJECT || "demo-ventas-flash";
const app = adminApp.getApps().length
  ? adminApp.getApp()
  : adminApp.initializeApp({ projectId });
const auth = adminAuth.getAuth(app);
const db = adminStore.getFirestore(app);

async function checkEmulators() {
  try {
    const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/`, {
      signal: AbortSignal.timeout(1500),
    }).catch(() => null);
    if (!res) {
      console.warn(
        "⚠️ No se pudo contactar al emulador de Auth en " +
          process.env.FIREBASE_AUTH_EMULATOR_HOST +
          ". Asegúrate de que `npm run emulators` esté ejecutándose."
      );
    }
  } catch {}
}

async function seed() {
  const now = Date.now();
  console.log("🌱 [SEED] Iniciando población en Firebase Emulator Suite...");
  console.log(`📡 Proyecto: ${projectId}`);
  console.log(`🔐 Auth Host: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`🗄️ Firestore Host: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  await checkEmulators();

  // 1. Usuarios en Authentication y Firestore
  console.log(`\n👤 [1/4] Poblando ${SEED_USERS.length} usuarios en Auth y Firestore...`);
  let usersCreated = 0;
  let usersUpdated = 0;

  for (const u of SEED_USERS) {
    try {
      // Intentar obtener el usuario en Auth
      let authUser = await auth.getUserByEmail(u.email).catch(() => null);
      if (!authUser) {
        authUser = await auth.createUser({
          uid: u.id,
          email: u.email,
          password: DEFAULT_TEST_PASSWORD,
          displayName: u.name,
          emailVerified: u.emailVerified,
        });
        usersCreated++;
      } else {
        await auth.updateUser(authUser.uid, {
          password: DEFAULT_TEST_PASSWORD,
          displayName: u.name,
          emailVerified: u.emailVerified,
        });
        usersUpdated++;
      }

      // Perfil en Firestore: users/{uid}
      await db.collection("users").doc(u.id).set(
        {
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          status: u.status,
          identityVerified: u.identityVerified,
          role: u.role,
          district: u.district,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          updatedAt: adminStore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error(`❌ Error con usuario ${u.email}:`, err.message);
    }
  }
  console.log(`✅ Usuarios listos (${usersCreated} creados, ${usersUpdated} sincronizados).`);

  // 2. Productos y subastas/remates en Firestore
  const products = getSeedProducts(now);
  console.log(`\n📦 [2/4] Poblando ${products.length} productos en Firestore...`);
  let batch = db.batch();
  let pendingWrites = 0;

  for (const p of products) {
    const pRef = db.collection("products").doc(p.id);
    batch.set(
      pRef,
      {
        sellerId: p.sellerId,
        sellerName: p.seller,
        sellerVerified: p.sellerVerified ?? false,
        title: p.title,
        description: p.description,
        mode: p.mode,
        category: p.category,
        image: p.image,
        status: p.status ?? "active",
        priceCents: Math.round(p.price * 100),
        originalCents: Math.round(p.original * 100),
        floorCents: Math.round(p.floor * 100),
        stepCents: Math.round(p.step * 100),
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        locationLabel: p.locationLabel ?? null,
        locationVisibility: p.locationVisibility ?? "approximate",
        isLive: p.isLive ?? false,
        endAt: new Date(p.end),
        createdAt: new Date(p.created),
      },
      { merge: true }
    );
    pendingWrites++;

    // Documento auxiliar de subasta
    if (p.mode === "subasta") {
      const aRef = db.collection("auctions").doc(p.id);
      batch.set(
        aRef,
        {
          productId: p.id,
          sellerId: p.sellerId,
          priceCents: Math.round(p.price * 100),
          incrementCents: Math.round((p.step || 50) * 100),
          leaderId: p.leaderId || null,
          winnerId: p.winnerId || null,
          endAt: new Date(p.end),
          status: p.status === "closed" ? "closed" : "active",
          bidCount: p.bids?.length || 0,
        },
        { merge: true }
      );
      pendingWrites++;
    }

    // Documento auxiliar de remate descendente
    if (p.mode === "remate") {
      const rRef = db.collection("descendingSales").doc(p.id);
      batch.set(
        rRef,
        {
          productId: p.id,
          initialCents: Math.round(p.price * 100),
          floorCents: Math.round(p.floor * 100),
          stepCents: Math.round(p.step * 100),
          intervalMs: 30000,
          startAt: new Date(p.created),
          status: p.status ?? "active",
        },
        { merge: true }
      );
      pendingWrites++;
    }

    if (pendingWrites >= 40) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  }
  if (pendingWrites > 0) {
    await batch.commit();
  }
  console.log(`✅ 60 productos sincronizados.`);

  // 3. Transmisiones Flash Live
  const liveStreams = getSeedLiveStreams(now);
  const liveMessages = getSeedLiveMessages(now);
  console.log(`\n🔴 [3/4] Poblando ${liveStreams.length} transmisiones Flash Live...`);

  for (const s of liveStreams) {
    await db.collection("liveStreams").doc(s.id).set(
      {
        id: s.id,
        title: s.title,
        description: s.description,
        sellerId: s.sellerId,
        sellerName: s.sellerName,
        sellerVerified: s.sellerVerified ?? false,
        status: s.status,
        startedAt: s.startedAt ? new Date(s.startedAt) : null,
        endedAt: s.endedAt ? new Date(s.endedAt) : null,
        productIds: s.productIds,
        activeProductId: s.activeProductId || null,
        viewerCount: s.viewerCount,
        thumbnailUrl: s.thumbnailUrl || null,
        createdAt: new Date(s.createdAt),
      },
      { merge: true }
    );

    // Mensajes de chat en subcolección
    const msgs = liveMessages[s.id] || [];
    for (const m of msgs) {
      await db
        .collection("liveStreams")
        .doc(s.id)
        .collection("messages")
        .doc(m.id)
        .set(
          {
            streamId: m.streamId,
            senderId: m.senderId,
            senderName: m.senderName,
            text: m.text,
            isSeller: m.isSeller ?? false,
            createdAt: new Date(m.createdAt),
          },
          { merge: true }
        );
    }
  }
  console.log(`✅ 5 sesiones Flash Live con mensajes públicos listas.`);

  // 4. Órdenes, pagos en custodia simulada y chat postventa
  const orders = getSeedOrders(now);
  console.log(`\n🤝 [4/4] Poblando ${orders.length} órdenes y chats postventa...`);

  for (const o of orders) {
    const participants = [o.buyerId, o.sellerId].filter(Boolean);
    const priceCents = Math.round(o.price * 100);
    const feeCents = Math.round(o.fee * 100);

    // Transacción
    await db.collection("transactions").doc(o.id).set(
      {
        productId: o.productId,
        buyerId: o.buyerId,
        sellerId: o.sellerId,
        participants,
        priceCents,
        feeCents,
        status: o.status,
        provider: "demo",
        createdAt: adminStore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Custodia simulada
    await db.collection("escrowPayments").doc(o.id).set(
      {
        transactionId: o.id,
        participants,
        provider: "demo",
        amountCents: priceCents,
        status: o.status,
        realFundsHeld: false,
      },
      { merge: true }
    );

    // Entrega
    await db.collection("deliveries").doc(o.id).set(
      {
        transactionId: o.id,
        participants,
        status: o.received ? "received" : "pending",
        receivedAt: o.received ? adminStore.FieldValue.serverTimestamp() : null,
      },
      { merge: true }
    );

    // Conversación postventa
    await db.collection("conversations").doc(o.id).set(
      {
        transactionId: o.id,
        participants,
        createdAt: adminStore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    for (let i = 0; i < o.messages.length; i++) {
      const m = o.messages[i];
      await db
        .collection("conversations")
        .doc(o.id)
        .collection("messages")
        .doc(`msg-${i + 1}`)
        .set(
          {
            senderId: m.senderId || (m.mine ? o.buyerId : o.sellerId),
            text: m.text,
            createdAt: new Date(m.time || now - (o.messages.length - i) * 60000),
          },
          { merge: true }
        );
    }
  }
  console.log(`✅ ${orders.length} órdenes y chats postventa sincronizados.`);

  console.log("\n=======================================================");
  console.log("🎉 SEED COMPLETADO EXITOSAMENTE EN FIREBASE EMULATORS");
  console.log("=======================================================");
  console.log(`• Usuarios: 15 (6 vendedores, 9 compradores)`);
  console.log(`  Contraseña universal: ${DEFAULT_TEST_PASSWORD}`);
  console.log(`• Productos: ${products.length} (25 normales, 25 subastas, 10 remates)`);
  console.log(`• Distritos cubiertos: 12 distritos de Lima`);
  console.log(`• Flash Live: 5 transmisiones (2 en vivo, 2 programadas, 1 finalizada)`);
  console.log(`• Transacciones de prueba: ${orders.length}`);
  console.log("=======================================================\n");
}

seed().catch((err) => {
  console.error("❌ Error al ejecutar el seed:", err);
  process.exit(1);
});
