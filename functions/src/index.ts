process.env.NO_PROXY ??= "127.0.0.1,localhost";
process.env.no_proxy ??= "127.0.0.1,localhost";
process.env.NO_UPDATE_NOTIFIER ??= "1";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  resolveBid,
  closeAuction,
  descendingPrice,
  feeCents,
  cents,
  type Offer,
  type AuctionState,
} from "./domain.js";
if (!getApps().length) initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });
const db = getFirestore();
function uid(r: CallableRequest, verified = true) {
  if (!r.auth) throw new HttpsError("unauthenticated", "Inicia sesión.");
  if (verified && !r.auth.token.email_verified)
    throw new HttpsError(
      "permission-denied",
      "Verifica tu correo antes de operar.",
    );
  return r.auth.uid;
}
function id(value: unknown) {
  if (typeof value !== "string" || !/^[-a-zA-Z0-9_]{1,128}$/.test(value))
    throw new HttpsError("invalid-argument", "ID inválido.");
  return value;
}
function text(value: unknown, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new HttpsError("invalid-argument", "Texto inválido.");
  return value.trim();
}
function fail(e: unknown): never {
  if (e instanceof HttpsError) throw e;
  throw new HttpsError(
    "failed-precondition",
    e instanceof Error ? e.message : "Operación no disponible.",
  );
}
function active(profile: FirebaseFirestore.DocumentSnapshot) {
  if (!profile.exists || profile.get("status") !== "active")
    throw new HttpsError("permission-denied", "Perfil no habilitado.");
}
function auctionState(a: FirebaseFirestore.DocumentData): AuctionState {
  return {
    priceCents: a.priceCents,
    incrementCents: a.incrementCents,
    endMs: a.endAt.toMillis(),
    leaderId: a.leaderId,
    status: a.status,
    winnerId: a.winnerId,
  };
}
export const ensureProfile = onCall(async (r) => {
  const userId = uid(r, false);
  const ref = db.doc(`users/${userId}`);
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists)
      tx.create(ref, {
        name: text(r.data.name || "Usuario", 80),
        email: r.auth!.token.email || "",
        status: "active",
        identityVerified: false,
        createdAt: FieldValue.serverTimestamp(),
      });
  });
  return { id: userId };
});
export const updateProfile = onCall(async (r) => {
  const userId = uid(r, false);
  await db.doc(`users/${userId}`).update({ name: text(r.data.name, 80) });
  return { ok: true };
});
export const createProduct = onCall(async (r) => {
  const userId = uid(r);
  const d = r.data,
    productId = id(d.id);
  let price: number;
  try {
    price = cents(d.price);
  } catch (e) {
    fail(e);
  }
  const title = text(d.title, 100),
    description = text(d.description, 2000),
    category = text(d.category, 40);
  if (!["normal", "subasta", "remate"].includes(d.mode))
    throw new HttpsError("invalid-argument", "Modalidad inválida.");
  const imagePath = d.imagePath || "";
  if (imagePath && imagePath !== `products/${userId}/${productId}/main`)
    throw new HttpsError("invalid-argument", "Ruta de imagen inválida.");
  await db.runTransaction(async (tx) => {
    const [profile, old] = await Promise.all([
      tx.get(db.doc(`users/${userId}`)),
      tx.get(db.doc(`products/${productId}`)),
    ]);
    active(profile);
    if (old.exists) {
      if (old.get("sellerId") !== userId)
        throw new HttpsError("already-exists", "ID utilizado.");
      return;
    }
    const now = Timestamp.now(),
      endAt = Timestamp.fromMillis(now.toMillis() + 180000);
    const latitude =
      typeof d.latitude === "number" && Number.isFinite(d.latitude) && d.latitude >= -90 && d.latitude <= 90
        ? Math.round(d.latitude * 10000) / 10000
        : null;
    const longitude =
      typeof d.longitude === "number" && Number.isFinite(d.longitude) && d.longitude >= -180 && d.longitude <= 180
        ? Math.round(d.longitude * 10000) / 10000
        : null;
    const locationLabel =
      typeof d.locationLabel === "string" && d.locationLabel.trim()
        ? text(d.locationLabel, 100)
        : "Lima, Perú";
    const locationVisibility =
      typeof d.locationVisibility === "string" && ["approximate", "exact", "hidden"].includes(d.locationVisibility)
        ? d.locationVisibility
        : "approximate";
    const isLive = d.isLive === true;

    tx.create(db.doc(`products/${productId}`), {
      title,
      description,
      category,
      mode: d.mode,
      sellerId: userId,
      sellerName: profile.get("name"),
      sellerVerified: profile.get("identityVerified") === true,
      imagePath,
      status: "active",
      priceCents: price,
      originalCents: price,
      createdAt: now,
      endAt,
      leaderId: null,
      winnerId: null,
      bidCount: 0,
      latitude,
      longitude,
      locationLabel,
      locationVisibility,
      isLive,
    });
    if (d.mode === "subasta")
      tx.create(db.doc(`auctions/${productId}`), {
        productId,
        sellerId: userId,
        priceCents: price,
        incrementCents: 5000,
        endAt,
        leaderId: null,
        winnerId: null,
        status: "active",
        bidCount: 0,
      });
    if (d.mode === "remate")
      tx.create(db.doc(`descendingSales/${productId}`), {
        productId,
        initialCents: price,
        floorCents: Math.round(price * 0.7),
        stepCents: Math.max(100, Math.round(price * 0.02)),
        intervalMs: 30000,
        startAt: now,
      });
  });
  return { id: productId };
});
export const editProduct = onCall(async (r) => {
  const userId = uid(r),
    productId = id(r.data.productId);
  const title = text(r.data.title, 100),
    description = text(r.data.description, 2000);
  await db.runTransaction(async (tx) => {
    const p = await tx.get(db.doc(`products/${productId}`));
    const profile = await tx.get(db.doc(`users/${userId}`));
    active(profile);
    if (
      !p.exists ||
      p.get("sellerId") !== userId ||
      p.get("status") !== "active" ||
      p.get("bidCount") !== 0 ||
      p.get("endAt").toMillis() <= Date.now()
    )
      throw new HttpsError(
        "permission-denied",
        "Solo puedes editar antes de recibir pujas y mientras la publicación está activa.",
      );
    tx.update(p.ref, { title, description });
  });
  return { ok: true };
});
async function bid(r: CallableRequest, automatic: boolean) {
  const userId = uid(r),
    productId = id(r.data.productId),
    requestId = id(r.data.requestId);
  let max: number;
  try {
    max = cents(r.data.amount);
  } catch (e) {
    fail(e);
  }
  const op = db.doc(`users/${userId}/operations/${requestId}`);
  return db.runTransaction(async (tx) => {
    const [prior, profile, p, a, offers] = await Promise.all([
      tx.get(op),
      tx.get(db.doc(`users/${userId}`)),
      tx.get(db.doc(`products/${productId}`)),
      tx.get(db.doc(`auctions/${productId}`)),
      tx.get(db.collection(`auctions/${productId}/autoBids`)),
    ]);
    if (prior.exists) {
      if (prior.get("productId") !== productId)
        throw new HttpsError(
          "invalid-argument",
          "ID de operación reutilizado.",
        );
      return prior.get("result");
    }
    active(profile);
    if (
      !a.exists ||
      !p.exists ||
      p.get("status") !== "active" ||
      p.get("sellerId") === userId
    )
      throw new HttpsError(
        "failed-precondition",
        "No puedes pujar en esta publicación.",
      );
    const now = Timestamp.now();
    let resolved;
    try {
      resolved = resolveBid(
        auctionState(a.data()!),
        offers.docs.map((x) => x.data() as Offer),
        userId,
        max,
        automatic,
        now.toMillis(),
      );
    } catch (e) {
      fail(e);
    }
    const next = resolved.auction,
      endAt = Timestamp.fromMillis(next.endMs),
      offer = resolved.offers.find((x) => x.uid === userId)!;
    tx.set(db.doc(`auctions/${productId}/autoBids/${userId}`), {
      ...offer,
      auctionId: productId,
    });
    tx.update(a.ref, {
      priceCents: next.priceCents,
      leaderId: next.leaderId,
      endAt,
      bidCount: FieldValue.increment(1),
    });
    tx.update(p.ref, {
      priceCents: next.priceCents,
      leaderId: next.leaderId,
      endAt,
      bidCount: FieldValue.increment(1),
    });
    // Only the effective price is public; submitted proxy ceilings never appear in history.
    tx.create(db.collection(`auctions/${productId}/bids`).doc(), {
      auctionId: productId,
      bidderId: next.leaderId,
      amountCents: next.priceCents,
      automatic: next.leaderId !== userId || automatic,
      createdAt: now,
    });
    const result = {
      priceCents: next.priceCents,
      leaderId: next.leaderId,
      endMs: next.endMs,
      extended: resolved.extended,
    };
    tx.create(op, { productId, result, createdAt: now });
    return result;
  });
}
export const placeBid = onCall((r) => bid(r, false));
export const setAutoBid = onCall((r) => bid(r, true));
export async function closeOne(productId: string) {
  return db.runTransaction(async (tx) => {
    const ref = db.doc(`auctions/${productId}`),
      a = await tx.get(ref);
    if (
      !a.exists ||
      a.get("status") === "closed" ||
      a.get("endAt").toMillis() > Date.now()
    )
      return false;
    const closed = closeAuction(auctionState(a.data()!), Date.now());
    tx.update(ref, {
      status: "closed",
      winnerId: closed.winnerId,
      closedAt: FieldValue.serverTimestamp(),
    });
    tx.update(db.doc(`products/${productId}`), {
      status: "closed",
      winnerId: closed.winnerId,
    });
    if (closed.winnerId)
      tx.set(db.doc(`notifications/winner_${productId}`), {
        userId: closed.winnerId,
        text: "Ganaste la subasta. Puedes completar la compra demo.",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    return true;
  });
}
export async function sweepExpiredAuctions() {
  for (let page = 0; page < 20; page++) {
    const docs = await db
      .collection("auctions")
      .where("status", "==", "active")
      .where("endAt", "<=", Timestamp.now())
      .orderBy("endAt")
      .limit(100)
      .get();
    if (docs.empty) break;
    for (const d of docs.docs) await closeOne(d.id);
    if (docs.size < 100) break;
  }
}
export const closeExpiredAuctions = onSchedule(
  { schedule: "every 1 minutes", timeZone: "America/Lima", retryCount: 3 },
  sweepExpiredAuctions,
);
export const closeAuctionNow = onCall(async (r) => {
  uid(r);
  return { closed: await closeOne(id(r.data.productId)) };
});
export const serverTime = onCall(() => ({ now: Date.now() }));
export const purchaseProduct = onCall(async (r) => {
  const buyerId = uid(r),
    productId = id(r.data.productId);
  const limit = cents(r.data.maxPrice);
  const transactionId = productId;
  return db.runTransaction(async (tx) => {
    const [profile, p, old, a, d] = await Promise.all([
      tx.get(db.doc(`users/${buyerId}`)),
      tx.get(db.doc(`products/${productId}`)),
      tx.get(db.doc(`transactions/${transactionId}`)),
      tx.get(db.doc(`auctions/${productId}`)),
      tx.get(db.doc(`descendingSales/${productId}`)),
    ]);
    active(profile);
    if (old.exists) {
      if (old.get("buyerId") === buyerId) return { id: transactionId };
      throw new HttpsError("already-exists", "Este producto ya fue comprado.");
    }
    if (
      !p.exists ||
      p.get("sellerId") === buyerId ||
      !["active", "closed"].includes(p.get("status"))
    )
      throw new HttpsError("failed-precondition", "Producto no disponible.");
    const now = Timestamp.now();
    let price = p.get("priceCents");
    if (p.get("mode") === "subasta") {
      if (
        !a.exists ||
        now.toMillis() < a.get("endAt").toMillis() ||
        a.get("leaderId") !== buyerId
      )
        throw new HttpsError(
          "permission-denied",
          "Solo el ganador puede comprar tras el cierre.",
        );
      tx.update(a.ref, { status: "closed", winnerId: buyerId, closedAt: now });
    }
    if (p.get("mode") === "remate") {
      if (!d.exists)
        throw new HttpsError("failed-precondition", "Remate incompleto.");
      const sale = d.data()!;
      price = descendingPrice(
        sale.initialCents,
        sale.floorCents,
        sale.stepCents,
        sale.intervalMs,
        sale.startAt.toMillis(),
        now.toMillis(),
      );
    }
    if (price > limit)
      throw new HttpsError(
        "failed-precondition",
        "El precio cambió. Revisa el total antes de confirmar.",
      );
    const fee = feeCents(price),
      participants = [buyerId, p.get("sellerId")];
    tx.create(db.doc(`transactions/${transactionId}`), {
      productId,
      title: p.get("title"),
      buyerId,
      sellerId: p.get("sellerId"),
      participants,
      priceCents: price,
      feeCents: fee,
      status: "delivery_pending",
      provider: "demo",
      createdAt: now,
      statusHistory: [
        "pending",
        "payment_confirmed",
        "payment_held",
        "delivery_pending",
      ],
    });
    tx.create(db.doc(`escrowPayments/${transactionId}`), {
      transactionId,
      participants,
      provider: "demo",
      amountCents: price + fee,
      status: "payment_held",
      realFundsHeld: false,
      createdAt: now,
    });
    tx.create(db.doc(`deliveries/${transactionId}`), {
      transactionId,
      participants,
      status: "pending",
      receivedAt: null,
    });
    tx.create(db.doc(`conversations/${transactionId}`), {
      transactionId,
      participants,
      createdAt: now,
    });
    tx.update(p.ref, {
      status: "sold",
      buyerId,
      ...(p.get("mode") === "subasta" ? { winnerId: buyerId } : {}),
    });
    return { id: transactionId };
  });
});
export const confirmReceipt = onCall(async (r) => {
  const userId = uid(r),
    orderId = id(r.data.orderId);
  return db.runTransaction(async (tx) => {
    const order = await tx.get(db.doc(`transactions/${orderId}`));
    const profile = await tx.get(db.doc(`users/${userId}`));
    active(profile);
    if (!order.exists || order.get("buyerId") !== userId)
      throw new HttpsError(
        "permission-denied",
        "Solo el comprador puede confirmar.",
      );
    if (order.get("status") === "completed") return { ok: true };
    if (
      order.get("status") !== "delivery_pending" ||
      order.get("provider") !== "demo"
    )
      throw new HttpsError(
        "failed-precondition",
        "Estado de pedido incompatible.",
      );
    const now = Timestamp.now();
    tx.update(order.ref, {
      status: "completed",
      receivedAt: now,
      statusHistory: FieldValue.arrayUnion(
        "receipt_confirmed",
        "release_requested",
        "completed",
      ),
    });
    tx.update(db.doc(`escrowPayments/${orderId}`), {
      status: "completed",
      releasedAt: now,
      realFundsHeld: false,
    });
    tx.update(db.doc(`deliveries/${orderId}`), {
      status: "received",
      receivedAt: now,
    });
    return { ok: true };
  });
});

export const createLiveStream = onCall(async (r) => {
  const userId = uid(r);
  const streamId = id(r.data.id || ("live-" + Date.now()));
  const title = text(r.data.title, 120);
  const description = typeof r.data.description === "string" ? text(r.data.description, 1000) : "";
  const rawProductIds = Array.isArray(r.data.productIds) ? r.data.productIds : [];
  const productIds = rawProductIds.map((p: unknown) => id(p));

  const profile = await db.doc(`users/${userId}`).get();
  active(profile);

  // Validar pertenencia de los productos al vendedor
  for (const pid of productIds) {
    const p = await db.doc(`products/${pid}`).get();
    if (!p.exists) throw new HttpsError("not-found", `Producto ${pid} no encontrado.`);
    if (p.get("sellerId") !== userId) {
      throw new HttpsError("permission-denied", `No eres el dueño del producto ${pid}.`);
    }
  }

  const now = Timestamp.now();
  await db.doc(`liveStreams/${streamId}`).set({
    id: streamId,
    title,
    description,
    sellerId: userId,
    sellerName: profile.get("name") || "Vendedor",
    sellerVerified: profile.get("identityVerified") === true,
    status: "scheduled",
    productIds,
    activeProductId: productIds[0] || null,
    viewerCount: 1,
    createdAt: now,
  });

  return { id: streamId };
});

export const startLiveStream = onCall(async (r) => {
  const userId = uid(r);
  const streamId = id(r.data.streamId);

  await db.runTransaction(async (tx) => {
    const streamRef = db.doc(`liveStreams/${streamId}`);
    const stream = await tx.get(streamRef);
    if (!stream.exists) throw new HttpsError("not-found", "Transmisión no encontrada.");
    if (stream.get("sellerId") !== userId) {
      throw new HttpsError("permission-denied", "Solo el anfitrión puede iniciar la transmisión.");
    }
    if (stream.get("status") === "ended") {
      throw new HttpsError("failed-precondition", "Esta transmisión ya ha finalizado.");
    }

    const now = Timestamp.now();
    tx.update(streamRef, {
      status: "live",
      startedAt: now,
    });

    const productIds: string[] = stream.get("productIds") || [];
    for (const pid of productIds) {
      tx.update(db.doc(`products/${pid}`), { isLive: true });
    }
  });

  return { ok: true };
});

export const endLiveStream = onCall(async (r) => {
  const userId = uid(r);
  const streamId = id(r.data.streamId);

  await db.runTransaction(async (tx) => {
    const streamRef = db.doc(`liveStreams/${streamId}`);
    const stream = await tx.get(streamRef);
    if (!stream.exists) throw new HttpsError("not-found", "Transmisión no encontrada.");
    if (stream.get("sellerId") !== userId) {
      throw new HttpsError("permission-denied", "Solo el anfitrión puede finalizar la transmisión.");
    }

    const now = Timestamp.now();
    tx.update(streamRef, {
      status: "ended",
      endedAt: now,
    });

    // Desmarcar isLive en los productos, sin cerrar subastas vigentes (regla del marketplace)
    const productIds: string[] = stream.get("productIds") || [];
    for (const pid of productIds) {
      tx.update(db.doc(`products/${pid}`), { isLive: false });
    }
  });

  return { ok: true };
});

export const setFeaturedLiveProduct = onCall(async (r) => {
  const userId = uid(r);
  const streamId = id(r.data.streamId);
  const productId = id(r.data.productId);

  await db.runTransaction(async (tx) => {
    const streamRef = db.doc(`liveStreams/${streamId}`);
    const stream = await tx.get(streamRef);
    if (!stream.exists) throw new HttpsError("not-found", "Transmisión no encontrada.");
    if (stream.get("sellerId") !== userId) {
      throw new HttpsError("permission-denied", "Solo el anfitrión puede cambiar el producto destacado.");
    }
    const productIds: string[] = stream.get("productIds") || [];
    if (!productIds.includes(productId)) {
      throw new HttpsError("invalid-argument", "El producto no forma parte de este directo.");
    }
    tx.update(streamRef, { activeProductId: productId });
  });

  return { ok: true };
});
