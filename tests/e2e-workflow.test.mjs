process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";

import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createRequire } from "node:module";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { haversineDistance } from "../src/lib/geo.ts";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const adminApp = require("firebase-admin/app");
const adminStore = require("firebase-admin/firestore");
const adminAuth = require("firebase-admin/auth");

const projectId = "demo-ventas-flash";
let admin;
let db;
let apps = [];

async function createClient(name) {
  const app = initializeApp(
    { projectId, apiKey: "demo-key", authDomain: "localhost", storageBucket: "demo-ventas-flash.appspot.com" },
    name + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)
  );
  apps.push(app);

  const auth = getAuth(app);
  const store = getFirestore(app);
  const fn = getFunctions(app, "us-central1");
  const storage = getStorage(app);

  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(store, "127.0.0.1", 8080);
  connectFunctionsEmulator(fn, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);

  const email = `${name.toLowerCase()}${Date.now()}${Math.floor(Math.random()*1000)}@ventasflash.pe`;
  const password = "PasswordSeguro123!";

  return {
    app,
    auth,
    store,
    storage,
    email,
    password,
    name,
    call: async (callName, data = {}) => (await httpsCallable(fn, callName)(data)).data,
  };
}

let seller;
let buyer;
let bidderC;

before(async () => {
  admin = adminApp.initializeApp({ projectId }, "admin-" + Date.now());
  db = adminStore.getFirestore(admin);

  seller = await createClient("Diego_Vendedor");
  buyer = await createClient("Camila_Compradora");
  bidderC = await createClient("Carlos_Postor");
});

after(async () => {
  await Promise.all(apps.map((a) => deleteApp(a)));
  if (admin) await adminApp.deleteApp(admin);
});

test("E2E Flujo 1: Registro, autenticación y persistencia de perfiles", async () => {
  // Registro de Vendedor
  const credA = await createUserWithEmailAndPassword(seller.auth, seller.email, seller.password);
  await updateProfile(credA.user, { displayName: "Diego Vendedor" });
  await adminAuth.getAuth(admin).updateUser(credA.user.uid, { emailVerified: true });
  await credA.user.getIdToken(true);
  seller.uid = credA.user.uid;
  await seller.call("ensureProfile", { name: "Diego Vendedor" });

  // Registro de Comprador
  const credB = await createUserWithEmailAndPassword(buyer.auth, buyer.email, buyer.password);
  await updateProfile(credB.user, { displayName: "Camila Compradora" });
  await adminAuth.getAuth(admin).updateUser(credB.user.uid, { emailVerified: true });
  await credB.user.getIdToken(true);
  buyer.uid = credB.user.uid;
  await buyer.call("ensureProfile", { name: "Camila Compradora" });

  // Registro de Tercer Postor
  const credC = await createUserWithEmailAndPassword(bidderC.auth, bidderC.email, bidderC.password);
  await updateProfile(credC.user, { displayName: "Carlos Postor" });
  await adminAuth.getAuth(admin).updateUser(credC.user.uid, { emailVerified: true });
  await credC.user.getIdToken(true);
  bidderC.uid = credC.user.uid;
  await bidderC.call("ensureProfile", { name: "Carlos Postor" });

  // Verificar persistencia de usuarios en Firestore
  const userDocA = await db.doc(`users/${seller.uid}`).get();
  assert.equal(userDocA.exists, true);
  assert.equal(userDocA.get("name"), "Diego Vendedor");
  assert.equal(userDocA.get("status"), "active");

  const userDocB = await db.doc(`users/${buyer.uid}`).get();
  assert.equal(userDocB.exists, true);
  assert.equal(userDocB.get("name"), "Camila Compradora");

  // Verificar logout e inicio de sesión
  await signOut(buyer.auth);
  assert.equal(buyer.auth.currentUser, null);

  const relogin = await signInWithEmailAndPassword(buyer.auth, buyer.email, buyer.password);
  assert.equal(relogin.user.uid, buyer.uid);
});

test("E2E Flujo 2: Subida de imagen a Storage emulado y publicación de producto", async () => {
  const productId = "macbook-" + Date.now();
  const imagePath = `products/${seller.uid}/${productId}/main`;

  // Simular subida de imagen PNG válida (1x1 pixel PNG)
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const storageRef = ref(seller.storage, imagePath);
  await uploadBytes(storageRef, pngHeader, { contentType: "image/png" });

  const url = await getDownloadURL(storageRef);
  assert.ok(url.includes("127.0.0.1:9199") || url.includes("products"));

  // Publicar producto en subasta
  await seller.call("createProduct", {
    id: productId,
    title: "MacBook Pro M2 - Impecable",
    description: "MacBook Pro en excelente estado, incluye caja y cargador. Lima.",
    category: "Tecnología",
    mode: "subasta",
    price: 1500,
    imagePath,
  });

  const pDoc = await db.doc(`products/${productId}`).get();
  assert.equal(pDoc.exists, true);
  assert.equal(pDoc.get("priceCents"), 150000);
  assert.equal(pDoc.get("sellerId"), seller.uid);
  assert.equal(pDoc.get("imagePath"), imagePath);
  assert.equal(pDoc.get("status"), "active");

  const aDoc = await db.doc(`auctions/${productId}`).get();
  assert.equal(aDoc.exists, true);
  assert.equal(aDoc.get("incrementCents"), 5000); // S/ 50
});

test("E2E Flujo 3: Subastas con sincronización en tiempo real y reloj anti-robo", async () => {
  const productId = "subasta-reloj-" + Date.now();

  await seller.call("createProduct", {
    id: productId,
    title: "Cámara Sony FX3",
    description: "Cámara de cine profesional.",
    category: "Fotografía",
    mode: "subasta",
    price: 2000,
  });

  // Ajustar vencimiento para que falten 20 segundos (dentro de ventana de 30s)
  const now = Date.now();
  const targetEnd = now + 20000;
  await db.doc(`auctions/${productId}`).update({
    endAt: adminStore.Timestamp.fromMillis(targetEnd),
  });

  // Listener en tiempo real desde el cliente de Vendedor
  let lastAuctionState = null;
  const unsub = onSnapshot(doc(seller.store, "auctions", productId), (snapshot) => {
    lastAuctionState = snapshot.data();
  });

  // Camila realiza una puja de S/ 2050 (mínimo incremento S/ 50)
  const bidResult = await buyer.call("placeBid", {
    productId,
    amount: 2050,
    requestId: "req-" + Date.now(),
  });

  // Verificar que el reloj anti-robo añadió 60 segundos
  assert.equal(bidResult.extended, true);
  assert.equal(bidResult.endMs, targetEnd + 60000);

  // Esperar a que el listener en tiempo real refleje el nuevo precio y líder
  await new Promise((r) => setTimeout(r, 600));
  unsub();

  assert.equal(lastAuctionState.leaderId, buyer.uid);
  assert.equal(lastAuctionState.priceCents, 205000);
  assert.equal(lastAuctionState.endAt.toMillis(), targetEnd + 60000);
});

test("E2E Flujo 4: Auto-puja inteligente con privacidad de límites", async () => {
  const productId = "subasta-autobid-" + Date.now();

  await seller.call("createProduct", {
    id: productId,
    title: "Bicicleta Trek Marlin 7",
    description: "Bicicleta de montaña en excelente estado.",
    category: "Otros",
    mode: "subasta",
    price: 800,
  });

  // Camila configura auto-puja con techo de S/ 1500
  await buyer.call("setAutoBid", {
    productId,
    amount: 1500,
    requestId: "autobid-camila-" + Date.now(),
  });

  // Carlos puja manualmente S/ 1100
  const bidC = await bidderC.call("placeBid", {
    productId,
    amount: 1100,
    requestId: "bid-carlos-" + Date.now(),
  });

  // El motor determinista debe mantener a Camila como líder a S/ 1150 (supera a Carlos por incremento S/ 50)
  assert.equal(bidC.leaderId, buyer.uid);
  assert.equal(bidC.priceCents, 115000); // S/ 1150

  // Verificar que el historial público de pujas NO revela el techo de Camila (S/ 1500)
  const bidsSnap = await db.collection(`auctions/${productId}/bids`).get();
  assert.ok(bidsSnap.size >= 2);
  bidsSnap.forEach((doc) => {
    assert.equal("maxCents" in doc.data(), false, "El techo privado no debe exponerse en el historial");
  });
});

test("E2E Flujo 5: Cierre de subasta, compra inmediata con tarifa del 4% y verificación", async () => {
  const productId = "subasta-checkout-" + Date.now();

  await seller.call("createProduct", {
    id: productId,
    title: "iPad Air 5ta Generación",
    description: "64GB Chip M1 Color Gris Espacial.",
    category: "Tecnología",
    mode: "subasta",
    price: 1200,
  });

  // Camila puja y queda como líder
  await buyer.call("placeBid", {
    productId,
    amount: 1250,
    requestId: "bid-ipad-" + Date.now(),
  });

  // Simular expiración de la subasta
  await db.doc(`auctions/${productId}`).update({
    endAt: adminStore.Timestamp.fromMillis(Date.now() - 5000),
  });

  // Cerrar subasta de forma determinista
  await buyer.call("closeAuctionNow", { productId });

  const closedAuction = await db.doc(`auctions/${productId}`).get();
  assert.equal(closedAuction.get("status"), "closed");
  assert.equal(closedAuction.get("winnerId"), buyer.uid);

  // Carlos (otro usuario) intenta comprarla y es RECHAZADO por no ser el ganador
  await assert.rejects(
    bidderC.call("purchaseProduct", { productId, maxPrice: 1500 }),
    /Solo el ganador puede comprar|permission-denied/
  );

  // Camila (ganadora) completa el checkout simulado
  const purchaseResult = await buyer.call("purchaseProduct", { productId, maxPrice: 1250 });
  assert.equal(purchaseResult.id, productId);

  // Verificar transacción creada en Firestore
  const txDoc = await db.doc(`transactions/${productId}`).get();
  assert.equal(txDoc.exists, true);
  assert.equal(txDoc.get("priceCents"), 125000);
  assert.equal(txDoc.get("feeCents"), 5000); // 4% de 1250 = S/ 50.00
  assert.equal(txDoc.get("status"), "delivery_pending");
  assert.equal(txDoc.get("provider"), "demo");

  // Verificar escrow simulado sin fondos reales
  const escrowDoc = await db.doc(`escrowPayments/${productId}`).get();
  assert.equal(escrowDoc.exists, true);
  assert.equal(escrowDoc.get("realFundsHeld"), false);
  assert.equal(escrowDoc.get("amountCents"), 130000); // 1250 + 50
});

test("E2E Flujo 6: Chat bilateral postventa en tiempo real y confirmación de recepción", async () => {
  const productId = "compra-chat-" + Date.now();

  // Publicar producto en modalidad normal
  await seller.call("createProduct", {
    id: productId,
    title: "Auriculares Bose 700",
    description: "Cancelación de ruido líder en el mercado.",
    category: "Música",
    mode: "normal",
    price: 600,
  });

  // Camila compra el producto inmediatamente
  await buyer.call("purchaseProduct", { productId, maxPrice: 600 });

  // Diego (vendedor) escucha mensajes entrantes en tiempo real
  const messagesReceived = [];
  const unsubChat = onSnapshot(
    collection(seller.store, `conversations/${productId}/messages`),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          messagesReceived.push(change.doc.data());
        }
      });
    }
  );

  // Camila envía mensaje de coordinación
  await addDoc(collection(buyer.store, `conversations/${productId}/messages`), {
    senderId: buyer.uid,
    text: "Hola Diego, ¿podemos coordinar la entrega hoy en Miraflores?",
    createdAt: serverTimestamp(),
  });

  // Esperar sincronización del listener en tiempo real
  await new Promise((r) => setTimeout(r, 800));

  assert.equal(messagesReceived.length, 1);
  assert.equal(messagesReceived[0].senderId, buyer.uid);
  assert.equal(messagesReceived[0].text, "Hola Diego, ¿podemos coordinar la entrega hoy en Miraflores?");

  // Diego responde
  await addDoc(collection(seller.store, `conversations/${productId}/messages`), {
    senderId: seller.uid,
    text: "¡Hola Camila! Sí, claro, nos vemos a las 5pm en el Parque Kennedy.",
    createdAt: serverTimestamp(),
  });

  await new Promise((r) => setTimeout(r, 600));
  unsubChat();

  // Diego (vendedor) intenta confirmar recepción y debe ser RECHAZADO (solo comprador puede confirmar)
  await assert.rejects(
    seller.call("confirmReceipt", { orderId: productId }),
    /Solo el comprador puede confirmar|permission-denied/
  );

  // Camila (compradora) confirma recepción
  const confirmResult = await buyer.call("confirmReceipt", { orderId: productId });
  assert.equal(confirmResult.ok, true);

  // Reintento idempotente
  const repeatConfirm = await buyer.call("confirmReceipt", { orderId: productId });
  assert.equal(repeatConfirm.ok, true);

  // Verificar estado final completado en Firestore
  const finalOrder = await db.doc(`transactions/${productId}`).get();
  assert.equal(finalOrder.get("status"), "completed");

  const finalDelivery = await db.doc(`deliveries/${productId}`).get();
  assert.equal(finalDelivery.get("status"), "received");
  assert.ok(finalDelivery.get("receivedAt") !== null);

  const finalEscrow = await db.doc(`escrowPayments/${productId}`).get();
  assert.equal(finalEscrow.get("status"), "completed");
  assert.equal(finalEscrow.get("realFundsHeld"), false);
});

test("E2E Flujo 7: Radar Flash - Publicación con ubicación, persistencia, redondeo y filtrado Haversine", async () => {
  const productId = "radar-product-" + Date.now();
  const rawLat = -12.149212345; // Coordenada con exceso de precisión
  const rawLon = -77.021098765;

  // 1. Diego (vendedor) publica producto con ubicación
  await seller.call("createProduct", {
    id: productId,
    title: "Cámara Sony A7 III - Barranco",
    description: "Cámara en excelente estado para entrega en Barranco.",
    category: "Fotografía",
    mode: "normal",
    price: 3500,
    latitude: rawLat,
    longitude: rawLon,
    locationLabel: "Barranco (Puente de los Suspiros)",
    locationVisibility: "approximate",
  });

  // 2. Verificar persistencia y sanitización en Firestore
  const productDoc = await db.doc(`products/${productId}`).get();
  assert.equal(productDoc.exists, true);
  assert.equal(productDoc.get("title"), "Cámara Sony A7 III - Barranco");
  assert.equal(productDoc.get("locationLabel"), "Barranco (Puente de los Suspiros)");
  assert.equal(productDoc.get("locationVisibility"), "approximate");

  // Redondeo de privacidad a 4 decimales (~11m de resolución)
  const savedLat = productDoc.get("latitude");
  const savedLon = productDoc.get("longitude");
  assert.equal(savedLat, -12.1492);
  assert.equal(savedLon, -77.0211);

  // 3. Lectura desde cliente comprador
  const buyerView = await getDoc(doc(buyer.store, "products", productId));
  assert.equal(buyerView.exists(), true);
  assert.equal(buyerView.data().latitude, -12.1492);
  assert.equal(buyerView.data().locationLabel, "Barranco (Puente de los Suspiros)");

  // 4. Filtrado por proximidad Haversine desde Miraflores (-12.1215, -77.0298)
  const userMiraflores = { lat: -12.1215, lon: -77.0298 };
  const distKm = haversineDistance(
    userMiraflores.lat,
    userMiraflores.lon,
    savedLat,
    savedLon
  );
  // Miraflores a Barranco es ~3.22 km
  assert.ok(distKm >= 3.1 && distKm <= 3.3, `Distancia esperada ~3.22km, calculada: ${distKm}`);

  // Simulación de filtros de proximidad del Radar Flash:
  const inRadius2Km = distKm <= 2;
  const inRadius5Km = distKm <= 5;
  const inRadius10Km = distKm <= 10;
  assert.equal(inRadius2Km, false, "A 2 km debe quedar excluido");
  assert.equal(inRadius5Km, true, "A 5 km debe estar incluido");
  assert.equal(inRadius10Km, true, "A 10 km debe estar incluido");

  // 5. Publicación con coordenadas fuera de rango se sanitiza a null de forma segura
  const invalidGeoId = "radar-invalid-" + Date.now();
  await seller.call("createProduct", {
    id: invalidGeoId,
    title: "Producto con Coordenada Inválida",
    description: "Prueba de seguridad y sanitización.",
    category: "Otros",
    mode: "normal",
    price: 100,
    latitude: 999, // Inválido (latitud máxima es 90)
    longitude: -77.0298,
    locationLabel: "Zona Desconocida",
  });

  const invalidDoc = await db.doc(`products/${invalidGeoId}`).get();
  assert.equal(invalidDoc.exists, true);
  assert.equal(invalidDoc.get("latitude"), null); // Sanitizado de forma segura
});

test("E2E Flujo 8: Flash Live - Creación de sala, inicio de transmisión, sincronización de productos, pujas en vivo y finalización", async () => {
  const liveStreamId = "live-stream-" + Date.now();
  const liveProductId = "live-item-" + Date.now();

  // 1. Diego (vendedor) publica un producto en subasta
  await seller.call("createProduct", {
    id: liveProductId,
    title: "iPad Pro M4 en Vivo",
    description: "Transmitiendo en directo para mostrar el estado de la pantalla y batería.",
    category: "Tecnología",
    mode: "subasta",
    price: 2500,
  });

  // 2. Diego crea la sala Flash Live con este producto
  const createStreamRes = await seller.call("createLiveStream", {
    id: liveStreamId,
    title: "Especial Apple Flash Live",
    description: "Probando el iPad Pro M4 con los postores en vivo.",
    productIds: [liveProductId],
  });
  assert.equal(createStreamRes.id, liveStreamId);

  // Verificar documento de liveStream en Firestore
  const streamDoc = await db.doc(`liveStreams/${liveStreamId}`).get();
  assert.equal(streamDoc.exists, true);
  assert.equal(streamDoc.get("status"), "scheduled");
  assert.equal(streamDoc.get("sellerId"), seller.uid);
  assert.equal(streamDoc.get("activeProductId"), liveProductId);

  // 3. Diego inicia la transmisión
  await seller.call("startLiveStream", { streamId: liveStreamId });

  const activeStreamDoc = await db.doc(`liveStreams/${liveStreamId}`).get();
  assert.equal(activeStreamDoc.get("status"), "live");
  assert.ok(activeStreamDoc.get("startedAt") !== null);

  // Verificar que el producto quedó marcado con isLive: true
  const productDoc = await db.doc(`products/${liveProductId}`).get();
  assert.equal(productDoc.get("isLive"), true);

  // 4. Camila (compradora) participa enviando mensaje al chat público del directo
  await addDoc(collection(buyer.store, `liveStreams/${liveStreamId}/messages`), {
    senderId: buyer.uid,
    senderName: "Camila Compradora",
    text: "¡Hola Diego! ¿Cuánto tiempo de garantía tiene?",
    createdAt: serverTimestamp(),
  });

  // 5. Camila realiza una puja en vivo sobre el producto presentado
  const bidResult = await buyer.call("placeBid", {
    productId: liveProductId,
    amount: 2550,
    requestId: "bid-live-" + Date.now(),
  });
  assert.equal(typeof bidResult.extended, "boolean");

  // Verificar que la subasta se actualizó correctamente con el nuevo líder
  const auctionDoc = await db.doc(`auctions/${liveProductId}`).get();
  assert.equal(auctionDoc.get("priceCents"), 255000);
  assert.equal(auctionDoc.get("leaderId"), buyer.uid);

  // 6. Diego finaliza la transmisión Flash Live
  await seller.call("endLiveStream", { streamId: liveStreamId });

  const endedStreamDoc = await db.doc(`liveStreams/${liveStreamId}`).get();
  assert.equal(endedStreamDoc.get("status"), "ended");
  assert.ok(endedStreamDoc.get("endedAt") !== null);

  // Verificar que la subasta NO fue cerrada prematuramente al terminar el vídeo (política de cierre respetada)
  const finalProductDoc = await db.doc(`products/${liveProductId}`).get();
  assert.equal(finalProductDoc.get("status"), "active");
  assert.equal(finalProductDoc.get("isLive"), false);
});
