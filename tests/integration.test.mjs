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
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
import {
  getFirestore,
  connectFirestoreEmulator,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const adminApp = require("firebase-admin/app"),
  adminStore = require("firebase-admin/firestore"),
  adminAuth = require("firebase-admin/auth");
let db,
  admin,
  clients = [];
const projectId = "demo-ventas-flash";
async function client(name) {
  const app = initializeApp(
    { projectId, apiKey: "demo-key", authDomain: "localhost" },
    name + Date.now(),
  );
  const auth = getAuth(app),
    fn = getFunctions(app),
    store = getFirestore(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFunctionsEmulator(fn, "127.0.0.1", 5001);
  connectFirestoreEmulator(store, "127.0.0.1", 8080);
  const email = name + Date.now() + "@example.test";
  const c = {
    app,
    auth,
    store,
    email,
    call: async (n, data = {}) => (await httpsCallable(fn, n)(data)).data,
  };
  await createUserWithEmailAndPassword(auth, email, "Test-password-123");
  await adminAuth
    .getAuth(admin)
    .updateUser(auth.currentUser.uid, { emailVerified: true });
  await auth.currentUser.getIdToken(true);
  c.uid = auth.currentUser.uid;
  await c.call("ensureProfile", { name });
  clients.push(c);
  return c;
}
let seller, buyer, other;
before(async () => {
  assert.equal(process.env.GCLOUD_PROJECT || projectId, projectId);
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "Emulator only");
  admin = adminApp.initializeApp({ projectId });
  db = adminStore.getFirestore(admin);
  seller = await client("seller");
  buyer = await client("buyer");
  other = await client("other");
});
after(async () => {
  await Promise.all(clients.map((c) => deleteApp(c.app)));
  if (admin) await adminApp.deleteApp(admin);
});
async function product(mode = "normal") {
  const id = crypto.randomUUID();
  await seller.call("createProduct", {
    id,
    title: "Producto de prueba",
    description: "Descripción para emuladores",
    category: "Tecnología",
    mode,
    price: 1000,
  });
  return id;
}
test("registro, perfil, login/logout y recuperación", async () => {
  assert.equal(
    (await db.doc(`users/${buyer.uid}`).get()).get("status"),
    "active",
  );
  await sendPasswordResetEmail(buyer.auth, buyer.email);
  await signOut(buyer.auth);
  assert.equal(buyer.auth.currentUser, null);
  await signInWithEmailAndPassword(
    buyer.auth,
    buyer.email,
    "Test-password-123",
  );
  assert.equal(buyer.auth.currentUser.uid, buyer.uid);
});
test("publicación persistente y edición restringida", async () => {
  const id = await product();
  assert.equal(
    (await db.doc(`products/${id}`).get()).get("priceCents"),
    100000,
  );
  await seller.call("editProduct", {
    productId: id,
    title: "Actualizado",
    description: "Descripción actualizada",
  });
  await assert.rejects(
    buyer.call("editProduct", {
      productId: id,
      title: "Ataque",
      description: "No permitido",
    }),
  );
});
test("usuario no verificado no opera; vendedor no puja su producto", async () => {
  const id = await product("subasta");
  await assert.rejects(
    seller.call("placeBid", {
      productId: id,
      amount: 1050,
      requestId: crypto.randomUUID(),
    }),
  );
  await adminAuth
    .getAuth(admin)
    .updateUser(other.uid, { emailVerified: false });
  await other.auth.currentUser.getIdToken(true);
  await assert.rejects(
    other.call("placeBid", {
      productId: id,
      amount: 1050,
      requestId: crypto.randomUUID(),
    }),
  );
  await adminAuth.getAuth(admin).updateUser(other.uid, { emailVerified: true });
  await other.auth.currentUser.getIdToken(true);
});
test("pujas simultáneas se serializan; una puja obsoleta se rechaza", async () => {
  const id = await product("subasta");
  const results = await Promise.allSettled(
    [buyer, other].map((c) =>
      c.call("placeBid", {
        productId: id,
        amount: 1050,
        requestId: crypto.randomUUID(),
      }),
    ),
  );
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (await db.doc(`auctions/${id}`).get()).get("priceCents"),
    105000,
  );
});
test("anti-robo añade exactamente 60s; reintento idempotente no vuelve a extender", async () => {
  const id = await product("subasta"),
    end = Date.now() + 25000;
  await db
    .doc(`auctions/${id}`)
    .update({ endAt: adminStore.Timestamp.fromMillis(end) });
  const requestId = crypto.randomUUID(),
    payload = { productId: id, amount: 1050, requestId };
  const r = await buyer.call("placeBid", payload);
  assert.equal(r.endMs, end + 60000);
  assert.deepEqual(await buyer.call("placeBid", payload), r);
});
test("auto-puja, privacidad del historial, cierre y ganador", async () => {
  const id = await product("subasta");
  await buyer.call("setAutoBid", {
    productId: id,
    amount: 2000,
    requestId: crypto.randomUUID(),
  });
  const r = await other.call("setAutoBid", {
    productId: id,
    amount: 1500,
    requestId: crypto.randomUUID(),
  });
  assert.equal(r.leaderId, buyer.uid);
  assert.equal(r.priceCents, 155000);
  const bids = await db.collection(`auctions/${id}/bids`).get();
  assert.ok(bids.docs.every((d) => !("maxCents" in d.data())));
  await db
    .doc(`auctions/${id}`)
    .update({ endAt: adminStore.Timestamp.fromMillis(Date.now() - 1000) });
  await assert.rejects(
    other.call("placeBid", {
      productId: id,
      amount: 1600,
      requestId: crypto.randomUUID(),
    }),
  );
  await buyer.call("closeAuctionNow", { productId: id });
  await buyer.call("closeAuctionNow", { productId: id });
  assert.equal(
    (await db.doc(`auctions/${id}`).get()).get("winnerId"),
    buyer.uid,
  );
  await assert.rejects(
    other.call("purchaseProduct", { productId: id, maxPrice: 2000 }),
  );
  await buyer.call("purchaseProduct", { productId: id, maxPrice: 2000 });
});
test("compra simultánea: único pedido, tarifa 4%, recepción exclusiva e idempotente", async () => {
  const id = await product();
  const rs = await Promise.allSettled(
    [buyer, other].map((c) =>
      c.call("purchaseProduct", { productId: id, maxPrice: 1000 }),
    ),
  );
  assert.equal(rs.filter((x) => x.status === "fulfilled").length, 1);
  const order = (await db.doc(`transactions/${id}`).get()).data();
  assert.equal(order.feeCents, 4000);
  assert.equal(order.provider, "demo");
  const winner = clients.find((c) => c.uid === order.buyerId);
  await assert.rejects(seller.call("confirmReceipt", { orderId: id }));
  await winner.call("confirmReceipt", { orderId: id });
  await winner.call("confirmReceipt", { orderId: id });
  assert.equal(
    (await db.doc(`escrowPayments/${id}`).get()).get("realFundsHeld"),
    false,
  );
  assert.equal(
    (await db.doc(`transactions/${id}`).get()).get("status"),
    "completed",
  );
});
test("remate usa hora servidor y respeta mínimo", async () => {
  const id = await product("remate");
  await db
    .doc(`descendingSales/${id}`)
    .update({ startAt: adminStore.Timestamp.fromMillis(Date.now() - 9999999) });
  await buyer.call("purchaseProduct", { productId: id, maxPrice: 1000 });
  assert.equal(
    (await db.doc(`transactions/${id}`).get()).get("priceCents"),
    70000,
  );
});
test("chat con listener recibe mensaje del otro participante", async () => {
  const id = await product();
  await buyer.call("purchaseProduct", { productId: id, maxPrice: 1000 });
  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop();
      reject(new Error("Listener timeout"));
    }, 10000);
    const stop = onSnapshot(
      collection(seller.store, `conversations/${id}/messages`),
      (s) => {
        if (s.docs.some((d) => d.data().text === "Hola desde comprador")) {
          clearTimeout(timer);
          stop();
          resolve(true);
        }
      },
      reject,
    );
  });
  await addDoc(collection(buyer.store, `conversations/${id}/messages`), {
    senderId: buyer.uid,
    text: "Hola desde comprador",
    createdAt: serverTimestamp(),
  });
  assert.equal(await received, true);
});
test("barrido programado cierra vencidas y conserva subastas extendidas; reintento seguro", async () => {
  const overdue = await product("subasta"),
    future = await product("subasta");
  await db
    .doc(`auctions/${overdue}`)
    .update({ endAt: adminStore.Timestamp.fromMillis(Date.now() - 1000) });
  const { sweepExpiredAuctions } = await import("../functions/lib/index.js");
  await sweepExpiredAuctions();
  await sweepExpiredAuctions();
  assert.equal(
    (await db.doc(`auctions/${overdue}`).get()).get("status"),
    "closed",
  );
  assert.equal(
    (await db.doc(`auctions/${future}`).get()).get("status"),
    "active",
  );
});
