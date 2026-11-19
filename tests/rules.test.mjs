process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";
import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-ventas-flash",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
    storage: {
      host: "127.0.0.1",
      port: 9199,
      rules: readFileSync("storage.rules", "utf8"),
    },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    for (const uid of ["buyer", "seller"])
      await setDoc(doc(db, "users", uid), { name: uid, status: "active" });
    await setDoc(doc(db, "products", "p"), {
      sellerId: "seller",
      priceCents: 10000,
      status: "active",
    });
    await setDoc(doc(db, "conversations", "o"), {
      participants: ["buyer", "seller"],
      transactionId: "o",
    });
    await setDoc(doc(db, "transactions", "o"), {
      participants: ["buyer", "seller"],
      buyerId: "buyer",
      status: "delivery_pending",
    });
    await setDoc(doc(db, "auctions/p/autoBids/buyer"), {
      uid: "buyer",
      maxCents: 50000,
    });
  });
});
const user = (id) => env.authenticatedContext(id, { email_verified: true });
test("catálogo público, usuario anónimo no puede publicar", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "products", "p")));
  await assertFails(setDoc(doc(db, "products", "new"), { sellerId: "x" }));
});
test("ni vendedor ni comprador escriben precios, ganador o pujas", async () => {
  for (const uid of ["seller", "buyer"]) {
    const db = user(uid).firestore();
    await assertFails(
      updateDoc(doc(db, "products", "p"), { priceCents: 1, winnerId: uid }),
    );
    await assertFails(
      setDoc(doc(db, "auctions/p/bids/fake"), { amountCents: 1 }),
    );
    await assertFails(
      setDoc(doc(db, `auctions/p/autoBids/${uid}`), { maxCents: 100 }),
    );
  }
});
test("máximo de auto-puja solo legible por propietario", async () => {
  await assertSucceeds(
    getDoc(doc(user("buyer").firestore(), "auctions/p/autoBids/buyer")),
  );
  await assertFails(
    getDoc(doc(user("seller").firestore(), "auctions/p/autoBids/buyer")),
  );
  await assertFails(
    getDocs(collection(user("seller").firestore(), "auctions/p/autoBids")),
  );
});
test("datos personales aislados y privilegios inmutables", async () => {
  await assertSucceeds(getDoc(doc(user("buyer").firestore(), "users/buyer")));
  await assertFails(getDoc(doc(user("seller").firestore(), "users/buyer")));
  await assertFails(
    updateDoc(doc(user("buyer").firestore(), "users/buyer"), {
      status: "active",
      identityVerified: true,
    }),
  );
});
test("chat: participantes, autor y timestamp verificados; terceros bloqueados", async () => {
  const db = user("buyer").firestore(),
    path = "conversations/o/messages/m";
  await assertSucceeds(
    setDoc(doc(db, path), {
      senderId: "buyer",
      text: "Hola",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(getDoc(doc(user("seller").firestore(), path)));
  await assertFails(getDoc(doc(user("stranger").firestore(), path)));
  await assertFails(
    setDoc(doc(db, "conversations/o/messages/spoof"), {
      senderId: "seller",
      text: "suplantado",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(updateDoc(doc(db, path), { text: "editado" }));
  await assertFails(
    setDoc(doc(db, "conversations/o/messages/time"), {
      senderId: "buyer",
      text: "hola",
      createdAt: new Date(0),
    }),
  );
});
test("estados económicos no pueden modificarse desde cliente", async () => {
  await assertSucceeds(
    getDoc(doc(user("buyer").firestore(), "transactions/o")),
  );
  await assertFails(
    updateDoc(doc(user("buyer").firestore(), "transactions/o"), {
      status: "completed",
    }),
  );
  await assertFails(
    getDoc(doc(user("stranger").firestore(), "transactions/o")),
  );
});
test("favoritos privados y propietario no suplantable", async () => {
  const db = user("buyer").firestore();
  await assertSucceeds(
    setDoc(doc(db, "favorites/buyer/items/p"), {
      userId: "buyer",
      productId: "p",
    }),
  );
  await assertFails(
    getDoc(doc(user("seller").firestore(), "favorites/buyer/items/p")),
  );
  await assertFails(
    setDoc(doc(db, "favorites/seller/items/p"), {
      userId: "seller",
      productId: "p",
    }),
  );
});
test("Storage exige propietario, MIME y tamaño; no permite reemplazar imagen", async () => {
  const s = user("buyer").storage(),
    key = "products/buyer/" + crypto.randomUUID() + "/main";
  await assertSucceeds(
    uploadBytes(ref(s, key), new Uint8Array([1, 2]), {
      contentType: "image/png",
    }),
  );
  await assertFails(
    uploadBytes(ref(s, key), new Uint8Array([3]), { contentType: "image/png" }),
  );
  await assertFails(
    uploadBytes(ref(s, "products/seller/x/main"), new Uint8Array([1]), {
      contentType: "image/png",
    }),
  );
  await assertFails(
    uploadBytes(ref(s, "products/buyer/html/main"), new Uint8Array([1]), {
      contentType: "text/html",
    }),
  );
  await assertFails(
    uploadBytes(
      ref(s, "products/buyer/large/main"),
      new Uint8Array(2 * 1024 * 1024 + 1),
      { contentType: "image/png" },
    ),
  );
});

test("campos geográficos protegidos: cliente no puede escribir ni alterar coordenadas en productos", async () => {
  for (const uid of ["seller", "buyer", "stranger"]) {
    const db = user(uid).firestore();
    // Intento de alterar coordenadas existentes en producto activo
    await assertFails(
      updateDoc(doc(db, "products", "p"), {
        latitude: -12.0000,
        longitude: -77.0000,
        locationLabel: "Distrito no verificado",
      }),
    );
    // Intento de inyectar producto con coordenadas directamente desde cliente
    await assertFails(
      setDoc(doc(db, "products", "geo-fake-" + uid), {
        title: "Producto falsificado",
        sellerId: uid,
        latitude: -12.1215,
        longitude: -77.0298,
        locationLabel: "Miraflores",
        locationVisibility: "exact",
      }),
    );
  }
});

test("reglas Flash Live: chat público, señalización WebRTC y bloqueo de escrituras directas a liveStreams", async () => {
  const dbBuyer = user("buyer").firestore();
  const dbSeller = user("seller").firestore();
  const dbAnon = env.unauthenticatedContext().firestore();

  // 1. Escritura directa en /liveStreams/{id} bloqueada para clientes
  await assertFails(
    setDoc(doc(dbSeller, "liveStreams/stream-fake"), {
      title: "Directo falso",
      sellerId: "seller",
      status: "live",
    }),
  );
  await assertFails(
    updateDoc(doc(dbBuyer, "liveStreams/stream-fake"), {
      status: "ended",
    }),
  );

  // 2. Chat público del directo: usuario autenticado y verificado puede enviar mensaje con campos exactos
  await assertSucceeds(
    setDoc(doc(dbBuyer, "liveStreams/s1/messages/m1"), {
      senderId: "buyer",
      senderName: "Comprador Verificado",
      text: "Pregunta en vivo desde el chat público.",
      createdAt: serverTimestamp(),
    }),
  );

  // Intento de suplantar autor en el chat público -> bloqueado
  await assertFails(
    setDoc(doc(dbBuyer, "liveStreams/s1/messages/m2"), {
      senderId: "seller",
      senderName: "Falso Vendedor",
      text: "Mensaje suplantado",
      createdAt: serverTimestamp(),
    }),
  );

  // Mensaje anónimo en el chat público -> bloqueado
  await assertFails(
    setDoc(doc(dbAnon, "liveStreams/s1/messages/m3"), {
      senderId: "anon",
      senderName: "Anónimo",
      text: "Mensaje sin auth",
      createdAt: serverTimestamp(),
    }),
  );

  // 3. Señalización WebRTC en /liveStreams/{id}/signaling/{uid}: usuario autenticado puede leer y escribir su propia señal
  await assertSucceeds(
    setDoc(doc(dbBuyer, "liveStreams/s1/signaling/buyer"), {
      type: "offer",
      sdp: "v=0...",
    }),
  );
  await assertSucceeds(
    getDoc(doc(dbBuyer, "liveStreams/s1/signaling/buyer")),
  );

  // Usuario anónimo no puede escribir señalización
  await assertFails(
    setDoc(doc(dbAnon, "liveStreams/s1/signaling/anon"), {
      type: "offer",
    }),
  );
});
