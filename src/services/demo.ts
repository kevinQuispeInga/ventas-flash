import {
  read,
  initial,
  KEY,
  type State,
  type Product,
  type Order,
  type LiveSession,
  type LiveChatMessage,
} from "../model";
import {
  cents,
  resolveBid,
  closeAuction,
  feeCents,
  descendingPrice,
  type Offer,
} from "../../functions/src/domain";
import type { MarketplaceService, Snapshot, ProductInput } from "./contracts";
import type { UserProfile } from "../types/firestore";
import {
  SEED_USERS,
  getSeedProducts,
  getSeedLiveStreams,
  getSeedLiveMessages,
  getSeedOrders,
} from "../data/seedData";

export const demoUser = (identifier: string): UserProfile => {
  if (identifier === "Carlos" || identifier === "demo-carlos") {
    return {
      id: "demo-carlos",
      name: "Carlos",
      email: "carlos@demo.local",
      emailVerified: true,
      status: "active",
      identityVerified: true,
    };
  }
  if (identifier === "Marta" || identifier === "demo-marta") {
    return {
      id: "demo-marta",
      name: "Marta",
      email: "marta@demo.local",
      emailVerified: true,
      status: "active",
      identityVerified: true,
    };
  }
  const found = SEED_USERS.find(
    (u) =>
      u.id === identifier ||
      u.name.toLowerCase() === identifier.toLowerCase() ||
      u.email.toLowerCase() === identifier.toLowerCase()
  );
  if (found) {
    return {
      id: found.id,
      name: found.name,
      email: found.email,
      emailVerified: found.emailVerified,
      status: found.status,
      identityVerified: found.identityVerified,
    };
  }
  return {
    id: "demo-" + identifier.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: identifier,
    email: identifier.toLowerCase().replace(/[^a-z0-9]/g, "") + "@demo.local",
    emailVerified: true,
    status: "active",
    identityVerified: true,
  };
};
export class DemoService implements MarketplaceService {
  readonly mode = "demo";
  private state: State = read();
  private user: UserProfile | null;
  private listeners = new Set<(s: Snapshot) => void>();
  private offers: Record<string, Offer[]>;
  private favorites: Record<string, string[]>;
  private profileNames: Record<string, string> = {};
  private liveMessages: Record<string, LiveChatMessage[]> = {};
  private error = "";
  constructor() {
    const name = localStorage.getItem("vf-demo-session");
    this.user = name === "signed-out" ? null : demoUser(name || "Marta");
    this.liveMessages["live-demo-1"] = [
      {
        id: "msg-1",
        streamId: "live-demo-1",
        senderId: "demo-marta",
        senderName: "Marta",
        text: "¡Hola Diego! ¿La MacBook incluye la caja y cargador original?",
        createdAt: Date.now() - 200000,
      },
      {
        id: "msg-2",
        streamId: "live-demo-1",
        senderId: "seller",
        senderName: "Diego R.",
        text: "¡Hola Marta! Sí, viene con caja impecable y cargador de 30W de Apple.",
        createdAt: Date.now() - 150000,
        isSeller: true,
      },
      {
        id: "msg-3",
        streamId: "live-demo-1",
        senderId: "demo-carlos",
        senderName: "Carlos",
        text: "Acabo de poner una puja de S/ 1,100 👍",
        createdAt: Date.now() - 90000,
      },
    ];
    try {
      this.offers = JSON.parse(localStorage.getItem("vf-demo-offers") || "{}");
      this.favorites = JSON.parse(
        localStorage.getItem("vf-demo-favorites") || "{}",
      );
      this.profileNames = JSON.parse(
        localStorage.getItem("vf-demo-profiles") || "{}",
      );
    } catch {
      this.offers = {};
      this.favorites = {};
    }
    if (this.user && this.profileNames[this.user.id])
      this.user.name = this.profileNames[this.user.id];
    this.favorites["demo-marta"] ??= this.state.favorites;
    this.state.products = this.state.products.map((p) => ({
      ...p,
      sellerId:
        p.sellerId || (p.seller === "Marta" ? "demo-marta" : "demo-carlos"),
      sellerVerified: true,
      status: this.state.orders.some((o) => o.productId === p.id)
        ? "sold"
        : p.status || "active",
      leaderId:
        p.leaderId || (p.bids[0]?.name === "Marta" ? "demo-marta" : null),
      latitude:
        p.latitude ??
        (p.id === "iphone"
          ? -12.0969
          : p.id === "guitarra"
            ? -12.1492
            : p.id === "sony"
              ? -12.1385
              : -12.1215),
      longitude:
        p.longitude ??
        (p.id === "iphone"
          ? -77.0347
          : p.id === "guitarra"
            ? -77.021
            : p.id === "sony"
              ? -76.995
              : -77.0298),
      locationLabel:
        p.locationLabel ||
        (p.id === "iphone"
          ? "San Isidro, Lima"
          : p.id === "guitarra"
            ? "Barranco, Lima"
            : p.id === "sony"
              ? "Surco, Lima"
              : "Miraflores, Lima"),
      locationVisibility: p.locationVisibility || "approximate",
    }));
    for (const p of this.state.products) {
      if (p.mode === "subasta" && p.leaderId && !this.offers[p.id]?.length)
        this.offers[p.id] = [
          {
            uid: p.leaderId,
            maxCents: Math.round(p.price * 100),
            priority: p.bids[0]?.time || p.created,
            automatic: false,
          },
        ];
    }
    this.state.orders = this.state.orders.map((o) => ({
      ...o,
      buyerId: o.buyerId || "demo-marta",
      sellerId: o.sellerId || "demo-carlos",
      status: o.received ? "completed" : "delivery_pending",
      provider: "demo",
    }));
    // Persist initial deadlines and the v1 migration even before the first action.
    if (localStorage.getItem("vf-seed-active") === "true" && this.state.products.length < 10) {
      this.seedDemoData(true);
    }
    this.emit();
  }
  private snapshot(): Snapshot {
    return {
      state: {
        ...this.state,
        favorites: this.user ? this.favorites[this.user.id] || [] : [],
        orders: this.state.orders.filter(
          (o) =>
            this.user &&
            (o.buyerId === this.user.id ||
              o.sellerId === this.user.id ||
              (this.user.id === "demo-marta" && o.buyerId === "usr-buyer-marta") ||
              (this.user.id === "demo-carlos" && o.buyerId === "usr-buyer-carlos")),
        ),
      },
      user: this.user,
      loading: false,
      error: this.error,
      clockOffset: 0,
    };
  }
  private emit() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
      localStorage.setItem("vf-demo-offers", JSON.stringify(this.offers));
      localStorage.setItem("vf-demo-favorites", JSON.stringify(this.favorites));
      localStorage.setItem(
        "vf-demo-profiles",
        JSON.stringify(this.profileNames),
      );
      this.error = "";
    } catch {
      this.error =
        "No se pudieron guardar los cambios locales. Libera almacenamiento.";
    }
    this.listeners.forEach((fn) => fn(this.snapshot()));
  }
  subscribe(fn: (s: Snapshot) => void) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }
  private require() {
    if (!this.user) throw new Error("Inicia sesión.");
    return this.user;
  }
  async switchDemo(name: string) {
    this.user = demoUser(name);
    this.user.name = this.profileNames[this.user.id] || this.user.name;
    localStorage.setItem("vf-demo-session", name);
    this.emit();
  }
  seedDemoData(force = false) {
    const isAlreadySeeded = localStorage.getItem("vf-seed-active") === "true";
    if (isAlreadySeeded && !force) return;
    const now = Date.now();
    const seedProds = getSeedProducts(now);
    const seedStreams = getSeedLiveStreams(now);
    const seedOrders = getSeedOrders(now);
    const seedMsgsMap = getSeedLiveMessages(now);

    this.state.products = seedProds;
    this.state.liveStreams = seedStreams;
    this.state.orders = seedOrders;

    for (const [streamId, msgs] of Object.entries(seedMsgsMap)) {
      this.liveMessages[streamId] = msgs;
    }

    for (const p of this.state.products) {
      if (p.mode === "subasta" && p.leaderId) {
        this.offers[p.id] = [
          {
            uid: p.leaderId,
            maxCents: Math.round(p.price * 100),
            priority: p.bids[0]?.time || p.created,
            automatic: false,
          },
        ];
      }
    }

    localStorage.setItem("vf-seed-active", "true");
    this.emit();
  }
  resetDemoData() {
    localStorage.removeItem(KEY);
    localStorage.removeItem("vf-demo-offers");
    localStorage.removeItem("vf-demo-favorites");
    localStorage.removeItem("vf-demo-profiles");
    localStorage.removeItem("vf-demo-session");
    localStorage.removeItem("vf-seed-active");
    this.offers = {};
    this.favorites = {};
    this.profileNames = {};
    this.liveMessages = {};
    this.state = initial();
    this.user = demoUser("Marta");
    this.emit();
  }
  async login(email: string) {
    await this.switchDemo(
      email.toLowerCase().includes("carlos") ? "Carlos" : "Marta",
    );
  }
  async register() {
    throw new Error(
      "El registro real está disponible en modo Firebase. En DEMO usa Marta o Carlos.",
    );
  }
  async logout() {
    this.user = null;
    localStorage.setItem("vf-demo-session", "signed-out");
    this.emit();
  }
  async resetPassword() {
    throw new Error("DEMO no envía correos. Selecciona Marta o Carlos.");
  }
  async verifyEmail() {}
  async refreshUser() {
    this.emit();
  }
  async updateProfile(name: string) {
    const u = this.require();
    if (!name.trim() || name.trim().length > 80)
      throw new Error("Nombre inválido.");
    this.profileNames[u.id] = name.trim();
    this.user = { ...u, name: name.trim() };
    this.emit();
  }
  async toggleFavorite(id: string) {
    const u = this.require(),
      list = this.favorites[u.id] || [];
    this.favorites[u.id] = list.includes(id)
      ? list.filter((x) => x !== id)
      : [...list, id];
    this.emit();
  }
  async createProduct(d: ProductInput) {
    const u = this.require(),
      price = cents(d.price) / 100,
      now = Date.now();
    if (!d.title.trim() || !d.description.trim())
      throw new Error("Completa título y descripción.");
    const p: Product = {
      id: d.id,
      title: d.title.trim(),
      description: d.description.trim(),
      category: d.category,
      mode: d.mode,
      price,
      original: price,
      floor: Math.round(price * 0.7 * 100) / 100,
      step: Math.max(100, Math.round(price * 100 * 0.02)) / 100,
      created: now,
      end: now + 180000,
      image: d.image,
      seller: u.name,
      sellerId: u.id,
      sellerVerified: true,
      bids: [],
      status: "active",
      leaderId: null,
      winnerId: null,
      latitude: d.latitude ?? -12.1215,
      longitude: d.longitude ?? -77.0298,
      locationLabel: d.locationLabel || "Miraflores, Lima",
      locationVisibility: d.locationVisibility || "approximate",
      isLive: d.isLive === true,
    };
    this.state = { ...this.state, products: [p, ...this.state.products] };
    this.emit();
    return p.id;
  }
  async editProduct(id: string, title: string, description: string) {
    const u = this.require(),
      p = this.product(id);
    if (
      p.sellerId !== u.id ||
      p.bids.length ||
      p.status !== "active" ||
      Date.now() >= p.end
    )
      throw new Error("No se puede editar esta publicación.");
    if (!title.trim() || !description.trim())
      throw new Error("Completa los campos.");
    this.replace({ ...p, title, description });
  }
  private product(id: string) {
    const p = this.state.products.find((x) => x.id === id);
    if (!p) throw new Error("Producto no encontrado.");
    return p;
  }
  private replace(p: Product) {
    this.state = {
      ...this.state,
      products: this.state.products.map((x) => (x.id === p.id ? p : x)),
    };
    this.emit();
  }
  async bid(id: string, amount: number, automatic = false) {
    const u = this.require(),
      p = this.product(id);
    if (p.sellerId === u.id || p.status !== "active" || p.mode !== "subasta")
      throw new Error("No puedes pujar en esta publicación.");
    const now = Date.now();
    const result = resolveBid(
      {
        priceCents: Math.round(p.price * 100),
        incrementCents: 5000,
        endMs: p.end,
        leaderId: p.leaderId || null,
        status: "active",
        winnerId: null,
      },
      this.offers[id] || [],
      u.id,
      cents(amount),
      automatic,
      now,
    );
    this.offers[id] = result.offers;
    const a = result.auction;
    this.replace({
      ...p,
      price: a.priceCents / 100,
      leaderId: a.leaderId,
      end: a.endMs,
      bids: [
        {
          name: a.leaderId === "demo-marta" ? "Marta" : "Carlos",
          bidderId: a.leaderId!,
          amount: a.priceCents / 100,
          time: now,
        },
        ...p.bids,
      ],
    });
    return { extended: result.extended };
  }
  async closeAuction(id: string) {
    const p = this.product(id);
    if (p.status !== "active" || p.mode !== "subasta") return;
    const a = closeAuction(
      {
        priceCents: Math.round(p.price * 100),
        incrementCents: 5000,
        endMs: p.end,
        leaderId: p.leaderId || null,
        winnerId: null,
        status: "active",
      },
      Date.now(),
    );
    this.replace({ ...p, status: "closed", winnerId: a.winnerId });
  }
  async purchase(id: string, maxPrice: number) {
    const u = this.require(),
      p = this.product(id);
    const old = this.state.orders.find((o) => o.productId === id);
    if (old) {
      if (old.buyerId === u.id) return old.id;
      throw new Error("El producto ya fue comprado.");
    }
    if (p.sellerId === u.id)
      throw new Error("No puedes comprar tu publicación.");
    if (p.mode === "subasta") {
      await this.closeAuction(id);
      if (this.product(id).winnerId !== u.id)
        throw new Error("Solo el ganador puede comprar.");
    }
    const price =
      p.mode === "remate"
        ? descendingPrice(
            Math.round(p.price * 100),
            Math.round(p.floor * 100),
            Math.round(p.step * 100),
            30000,
            p.created,
            Date.now(),
          )
        : Math.round(p.price * 100);
    if (price > cents(maxPrice))
      throw new Error("El precio cambió. Revisa el total.");
    const o: Order = {
      id: crypto.randomUUID(),
      productId: id,
      title: p.title,
      price: price / 100,
      fee: feeCents(price) / 100,
      received: false,
      buyerId: u.id,
      sellerId: p.sellerId,
      status: "delivery_pending",
      provider: "demo",
      messages: [
        {
          text: "Compra DEMO confirmada. Coordina la entrega aquí; puedes cambiar de usuario para responder.",
          mine: false,
          senderId: p.sellerId,
          time: Date.now(),
        },
      ],
    };
    this.state = { ...this.state, orders: [o, ...this.state.orders] };
    this.replace({ ...this.product(id), status: "sold" });
    return o.id;
  }
  async confirmReceipt(id: string) {
    const u = this.require(),
      o = this.state.orders.find((x) => x.id === id);
    if (!o || o.buyerId !== u.id)
      throw new Error("Solo el comprador puede confirmar.");
    this.state = {
      ...this.state,
      orders: this.state.orders.map((x) =>
        x.id === id ? { ...x, received: true, status: "completed" } : x,
      ),
    };
    this.emit();
  }
  async sendMessage(id: string, text: string) {
    const u = this.require(),
      o = this.state.orders.find((x) => x.id === id);
    if (!o || ![o.buyerId, o.sellerId].includes(u.id))
      throw new Error("Sin acceso.");
    if (!text.trim() || text.length > 1000)
      throw new Error("Mensaje inválido.");
    this.state = {
      ...this.state,
      orders: this.state.orders.map((x) =>
        x.id === id
          ? {
              ...x,
              messages: [
                ...x.messages,
                {
                  text: text.trim(),
                  mine: true,
                  senderId: u.id,
                  time: Date.now(),
                },
              ],
            }
          : x,
      ),
    };
    this.emit();
  }
  subscribeBids(id: string, next: (b: Product["bids"]) => void) {
    return this.subscribe(() => next(this.product(id).bids));
  }
  subscribeMessages(id: string, next: (m: Order["messages"]) => void) {
    return this.subscribe(() => {
      const o = this.snapshot().state.orders.find((x) => x.id === id);
      next(
        (o?.messages || []).map((m) => ({
          ...m,
          mine: m.senderId ? m.senderId === this.user?.id : m.mine,
        })),
      );
    });
  }
  subscribeAutoBid(id: string, next: (n: number | null) => void) {
    return this.subscribe(() => {
      const a = this.offers[id]?.find(
        (x) => x.uid === this.user?.id && x.automatic,
      );
      next(a ? a.maxCents / 100 : null);
    });
  }

  async createLiveStream(title: string, description: string, productIds: string[]) {
    const u = this.require();
    const id = "live-" + Date.now();
    const stream: LiveSession = {
      id,
      title: title.trim(),
      description: description.trim(),
      sellerId: u.id,
      sellerName: u.name,
      sellerVerified: true,
      status: "scheduled",
      productIds,
      activeProductId: productIds[0],
      viewerCount: 1,
      createdAt: Date.now(),
    };
    this.state = {
      ...this.state,
      liveStreams: [stream, ...(this.state.liveStreams || [])],
    };
    this.emit();
    return id;
  }

  async startLiveStream(streamId: string) {
    const u = this.require();
    const stream = (this.state.liveStreams || []).find((s) => s.id === streamId);
    if (!stream) throw new Error("Transmisión no encontrada.");
    if (stream.sellerId !== u.id) throw new Error("Solo el anfitrión puede iniciar la transmisión.");

    const updatedProducts = this.state.products.map((p) =>
      stream.productIds.includes(p.id) ? { ...p, isLive: true } : p
    );

    const updatedStreams = (this.state.liveStreams || []).map((s) =>
      s.id === streamId ? { ...s, status: "live" as const, startedAt: Date.now() } : s
    );

    this.state = {
      ...this.state,
      products: updatedProducts,
      liveStreams: updatedStreams,
    };
    this.emit();
  }

  async endLiveStream(streamId: string) {
    const u = this.require();
    const stream = (this.state.liveStreams || []).find((s) => s.id === streamId);
    if (!stream) throw new Error("Transmisión no encontrada.");
    if (stream.sellerId !== u.id) throw new Error("Solo el anfitrión puede finalizar la transmisión.");

    const updatedProducts = this.state.products.map((p) =>
      stream.productIds.includes(p.id) ? { ...p, isLive: false } : p
    );

    const updatedStreams = (this.state.liveStreams || []).map((s) =>
      s.id === streamId ? { ...s, status: "ended" as const, endedAt: Date.now() } : s
    );

    this.state = {
      ...this.state,
      products: updatedProducts,
      liveStreams: updatedStreams,
    };
    this.emit();
  }

  async setFeaturedLiveProduct(streamId: string, productId: string) {
    const u = this.require();
    const stream = (this.state.liveStreams || []).find((s) => s.id === streamId);
    if (!stream) throw new Error("Transmisión no encontrada.");
    if (stream.sellerId !== u.id) throw new Error("Solo el anfitrión puede cambiar el producto destacado.");

    const updatedStreams = (this.state.liveStreams || []).map((s) =>
      s.id === streamId ? { ...s, activeProductId: productId } : s
    );

    this.state = {
      ...this.state,
      liveStreams: updatedStreams,
    };
    this.emit();
  }

  async sendLiveChatMessage(streamId: string, text: string) {
    const u = this.require();
    if (!text.trim() || text.length > 300) throw new Error("Mensaje inválido (máx. 300 caracteres).");

    const stream = (this.state.liveStreams || []).find((s) => s.id === streamId);
    const isSeller = stream ? stream.sellerId === u.id : false;

    const msg: LiveChatMessage = {
      id: "live-msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      streamId,
      senderId: u.id,
      senderName: u.name,
      text: text.trim(),
      createdAt: Date.now(),
      isSeller,
    };

    if (!this.liveMessages[streamId]) {
      this.liveMessages[streamId] = [];
    }
    this.liveMessages[streamId].push(msg);
    this.emit();
  }

  subscribeLiveStreams(next: (streams: LiveSession[]) => void) {
    return this.subscribe(() => {
      next(this.state.liveStreams || []);
    });
  }

  subscribeLiveMessages(streamId: string, next: (messages: LiveChatMessage[]) => void) {
    return this.subscribe(() => {
      next(this.liveMessages[streamId] || []);
    });
  }
}
