import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  updateProfile as authUpdateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseClient } from "../lib/firebase";
import type { MarketplaceService, Snapshot, ProductInput } from "./contracts";
import { friendly } from "./contracts";
import type { Product, Order, LiveSession, LiveChatMessage } from "../model";
import type { UserProfile } from "../types/firestore";
const ms = (v: any) => v?.toMillis?.() || 0;
export class FirebaseService implements MarketplaceService {
  readonly mode = "firebase";
  private client = firebaseClient();
  private snapshot: Snapshot = {
    state: { products: [], orders: [], favorites: [], liveStreams: [] },
    user: null,
    loading: true,
    error: "",
    clockOffset: 0,
  };
  private listeners = new Set<(s: Snapshot) => void>();
  private stops: (() => void)[] = [];
  private privateStops: (() => void)[] = [];
  private sales = new Map<string, any>();
  private products: any[] = [];
  private images = new Map<string, string>();
  private authGeneration = 0;
  private emit() {
    this.listeners.forEach((fn) => fn(this.snapshot));
  }
  private error = (e: unknown) => {
    this.snapshot = { ...this.snapshot, error: friendly(e), loading: false };
    this.emit();
  };
  private async call<T = any>(name: string, data: unknown = {}): Promise<T> {
    const result = await httpsCallable<unknown, T>(
      this.client.functions,
      name,
    )(data);
    return result.data;
  }
  private mapProducts() {
    this.snapshot = {
      ...this.snapshot,
      state: {
        ...this.snapshot.state,
        products: this.products.map((d) => {
          const sale = this.sales.get(d.id);
          return {
            id: d.id,
            title: d.title,
            description: d.description,
            category: d.category,
            mode: d.mode,
            price: (sale?.initialCents ?? d.priceCents) / 100,
            original: (d.originalCents ?? d.priceCents) / 100,
            floor: (sale?.floorCents ?? d.floorCents ?? d.priceCents) / 100,
            step: (sale?.stepCents ?? d.stepCents ?? 0) / 100,
            created: ms(sale?.startAt || d.createdAt),
            end: ms(d.endAt),
            image: d.imagePath ? (this.images.get(d.imagePath) || d.image || "") : (d.image || ""),
            seller: d.sellerName,
            sellerId: d.sellerId,
            sellerVerified: d.sellerVerified,
            status: d.status,
            leaderId: d.leaderId,
            winnerId: d.winnerId,
            bids: [],
            latitude: d.latitude,
            longitude: d.longitude,
            locationLabel: d.locationLabel || "Lima, Perú",
            locationVisibility: d.locationVisibility || "approximate",
            isLive: d.isLive === true,
          } as Product;
        }),
      },
    };
    this.emit();
  }
  subscribe(next: (s: Snapshot) => void) {
    this.listeners.add(next);
    next(this.snapshot);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(next);
      if (!this.listeners.size) {
        this.stops.forEach((s) => s());
        this.privateStops.forEach((s) => s());
        this.stops = [];
        this.privateStops = [];
        this.authGeneration++;
      }
    };
  }
  private start() {
    const { db, auth } = this.client;
    this.stops.push(
      onSnapshot(
        query(collection(db, "products"), orderBy("createdAt", "desc")),
        (s) => {
          this.products = s.docs.map((d) => ({ id: d.id, ...d.data() }));
          this.mapProducts();
          for (const d of this.products)
            if (d.imagePath && !this.images.has(d.imagePath)) {
              this.images.set(d.imagePath, "");
              getDownloadURL(ref(this.client.storage, d.imagePath))
                .then((url) => {
                  this.images.set(d.imagePath, url);
                  this.mapProducts();
                })
                .catch(this.error);
            }
        },
        this.error,
      ),
    );
    this.stops.push(
      onSnapshot(
        collection(db, "descendingSales"),
        (s) => {
          this.sales = new Map(s.docs.map((d) => [d.id, d.data()]));
          this.mapProducts();
        },
        this.error,
      ),
    );
    this.stops.push(
      onSnapshot(
        query(collection(db, "liveStreams"), orderBy("createdAt", "desc")),
        (s) => {
          const liveStreams = s.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title,
              description: data.description,
              sellerId: data.sellerId,
              sellerName: data.sellerName,
              sellerVerified: data.sellerVerified,
              status: data.status,
              startedAt: ms(data.startedAt),
              endedAt: ms(data.endedAt),
              productIds: data.productIds || [],
              activeProductId: data.activeProductId,
              viewerCount: data.viewerCount || 1,
              createdAt: ms(data.createdAt),
            } as LiveSession;
          });
          this.snapshot = {
            ...this.snapshot,
            state: { ...this.snapshot.state, liveStreams },
          };
          this.emit();
        },
        this.error,
      ),
    );
    this.stops.push(
      onAuthStateChanged(auth, async (user) => {
        const generation = ++this.authGeneration;
        this.privateStops.forEach((s) => s());
        this.privateStops = [];
        this.snapshot = {
          ...this.snapshot,
          user: null,
          loading: !!user,
          state: { ...this.snapshot.state, orders: [], favorites: [] },
        };
        this.emit();
        if (!user) return;
        try {
          await this.call("ensureProfile", {
            name: user.displayName || "Usuario",
          });
          if (generation !== this.authGeneration) return;
          this.privateStops.push(
            onSnapshot(
              doc(db, "users", user.uid),
              (p) => {
                const d = p.data();
                this.snapshot = {
                  ...this.snapshot,
                  loading: false,
                  user: d
                    ? ({
                        id: user.uid,
                        name: d.name,
                        email: user.email || "",
                        emailVerified: user.emailVerified,
                        status: d.status,
                        identityVerified: d.identityVerified,
                      } as UserProfile)
                    : null,
                };
                this.emit();
              },
              this.error,
            ),
          );
          this.privateStops.push(
            onSnapshot(
              collection(db, `favorites/${user.uid}/items`),
              (s) => {
                this.snapshot = {
                  ...this.snapshot,
                  state: {
                    ...this.snapshot.state,
                    favorites: s.docs.map((d) => d.id),
                  },
                };
                this.emit();
              },
              this.error,
            ),
          );
          this.privateStops.push(
            onSnapshot(
              query(
                collection(db, "transactions"),
                where("participants", "array-contains", user.uid),
                orderBy("createdAt", "desc"),
              ),
              (s) => {
                this.snapshot = {
                  ...this.snapshot,
                  state: {
                    ...this.snapshot.state,
                    orders: s.docs.map((x) => {
                      const d = x.data();
                      return {
                        id: x.id,
                        productId: d.productId,
                        title: d.title,
                        price: d.priceCents / 100,
                        fee: d.feeCents / 100,
                        received: d.status === "completed",
                        status: d.status,
                        buyerId: d.buyerId,
                        sellerId: d.sellerId,
                        provider: d.provider,
                        messages: [],
                      };
                    }),
                  },
                };
                this.emit();
              },
              this.error,
            ),
          );
        } catch (e) {
          this.error(e);
        }
      }),
    );
    this.call<{ now: number }>("serverTime")
      .then(({ now }) => {
        this.snapshot = { ...this.snapshot, clockOffset: now - Date.now() };
        this.emit();
      })
      .catch(this.error);
  }
  async login(email: string, password: string) {
    await setPersistence(this.client.auth, browserLocalPersistence);
    await signInWithEmailAndPassword(this.client.auth, email, password);
  }
  async register(name: string, email: string, password: string) {
    if (password.length < 8) throw new Error("Usa al menos 8 caracteres.");
    await setPersistence(this.client.auth, browserLocalPersistence);
    const { user } = await createUserWithEmailAndPassword(
      this.client.auth,
      email,
      password,
    );
    await authUpdateProfile(user, { displayName: name });
    await this.call("ensureProfile", { name });
    await this.call("updateProfile", { name });
    await sendEmailVerification(user);
  }
  async logout() {
    await signOut(this.client.auth);
  }
  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.client.auth, email);
  }
  async verifyEmail() {
    const user = this.client.auth.currentUser;
    if (user) await sendEmailVerification(user);
  }
  async refreshUser() {
    const u = this.client.auth.currentUser;
    if (u) {
      await u.reload();
      await u.getIdToken(true);
      this.snapshot = {
        ...this.snapshot,
        user: this.snapshot.user
          ? { ...this.snapshot.user, emailVerified: u.emailVerified }
          : null,
      };
      this.emit();
    }
  }
  async updateProfile(name: string) {
    await this.call("updateProfile", { name });
  }
  async switchDemo() {
    throw new Error(
      "Los usuarios de demostración solo están disponibles en modo DEMO.",
    );
  }
  async toggleFavorite(id: string) {
    const uid = this.client.auth.currentUser?.uid;
    if (!uid) throw new Error("Inicia sesión para guardar favoritos.");
    const r = doc(this.client.db, `favorites/${uid}/items/${id}`);
    if (this.snapshot.state.favorites.includes(id)) await deleteDoc(r);
    else await setDoc(r, { userId: uid, productId: id });
  }
  async createProduct(d: ProductInput) {
    const uid = this.client.auth.currentUser?.uid;
    if (!uid) throw new Error("Inicia sesión.");
    let imagePath = "";
    if (d.file) {
      validateImage(d.file);
      imagePath = `products/${uid}/${d.id}/main`;
      await uploadBytes(ref(this.client.storage, imagePath), d.file, {
        contentType: d.file.type,
      });
    }
    await this.call("createProduct", {
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      mode: d.mode,
      price: d.price,
      imagePath,
      latitude: d.latitude,
      longitude: d.longitude,
      locationLabel: d.locationLabel,
      locationVisibility: d.locationVisibility,
      isLive: d.isLive,
    });
    return d.id;
  }
  async editProduct(productId: string, title: string, description: string) {
    await this.call("editProduct", { productId, title, description });
  }
  async bid(productId: string, amount: number, automatic = false) {
    return this.call<{ extended: boolean }>(
      automatic ? "setAutoBid" : "placeBid",
      { productId, amount, requestId: crypto.randomUUID() },
    );
  }
  async closeAuction(productId: string) {
    await this.call("closeAuctionNow", { productId });
  }
  async purchase(productId: string, maxPrice: number) {
    return (
      await this.call<{ id: string }>("purchaseProduct", {
        productId,
        maxPrice,
      })
    ).id;
  }
  async confirmReceipt(orderId: string) {
    await this.call("confirmReceipt", { orderId });
  }
  async sendMessage(id: string, text: string) {
    const uid = this.client.auth.currentUser?.uid;
    if (!uid) throw new Error("Inicia sesión.");
    if (!text.trim() || text.length > 1000)
      throw new Error("Mensaje inválido.");
    await addDoc(collection(this.client.db, `conversations/${id}/messages`), {
      senderId: uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  }
  subscribeBids(
    id: string,
    next: (b: Product["bids"]) => void,
    error: (s: string) => void,
  ) {
    return onSnapshot(
      query(
        collection(this.client.db, `auctions/${id}/bids`),
        orderBy("createdAt", "desc"),
      ),
      (s) =>
        next(
          s.docs.map((x) => {
            const d = x.data();
            return {
              name:
                d.bidderId === this.snapshot.user?.id
                  ? "Tú"
                  : "Participante " + d.bidderId.slice(-4),
              bidderId: d.bidderId,
              amount: d.amountCents / 100,
              time: ms(d.createdAt),
            };
          }),
        ),
      (e) => error(friendly(e)),
    );
  }
  subscribeMessages(
    id: string,
    next: (m: Order["messages"]) => void,
    error: (s: string) => void,
  ) {
    return onSnapshot(
      query(
        collection(this.client.db, `conversations/${id}/messages`),
        orderBy("createdAt", "asc"),
      ),
      (s) =>
        next(
          s.docs.map((x) => {
            const d = x.data();
            return {
              text: d.text,
              mine: d.senderId === this.snapshot.user?.id,
              senderId: d.senderId,
              time: ms(d.createdAt),
            };
          }),
        ),
      (e) => error(friendly(e)),
    );
  }
  subscribeAutoBid(
    id: string,
    next: (n: number | null) => void,
    error: (s: string) => void,
  ) {
    const uid = this.client.auth.currentUser?.uid;
    if (!uid) {
      next(null);
      return () => {};
    }
    return onSnapshot(
      doc(this.client.db, `auctions/${id}/autoBids/${uid}`),
      (d) =>
        next(d.exists() && d.get("automatic") ? d.get("maxCents") / 100 : null),
      (e) => error(friendly(e)),
    );
  }

  async createLiveStream(title: string, description: string, productIds: string[]): Promise<string> {
    const res = await this.call("createLiveStream", { title, description, productIds });
    return res.id;
  }

  async startLiveStream(streamId: string): Promise<void> {
    await this.call("startLiveStream", { streamId });
  }

  async endLiveStream(streamId: string): Promise<void> {
    await this.call("endLiveStream", { streamId });
  }

  async setFeaturedLiveProduct(streamId: string, productId: string): Promise<void> {
    await this.call("setFeaturedLiveProduct", { streamId, productId });
  }

  async sendLiveChatMessage(streamId: string, text: string): Promise<void> {
    const user = this.snapshot.user;
    if (!user) throw new Error("Inicia sesión para participar en el chat del directo.");
    if (!text.trim() || text.length > 300) throw new Error("Mensaje inválido (máx. 300 caracteres).");

    await addDoc(collection(this.client.db, `liveStreams/${streamId}/messages`), {
      senderId: user.id,
      senderName: user.name,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  }

  subscribeLiveStreams(
    next: (streams: LiveSession[]) => void,
    error: (s: string) => void,
  ) {
    return onSnapshot(
      query(collection(this.client.db, "liveStreams"), orderBy("createdAt", "desc")),
      (s) =>
        next(
          s.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title,
              description: data.description,
              sellerId: data.sellerId,
              sellerName: data.sellerName,
              sellerVerified: data.sellerVerified,
              status: data.status,
              startedAt: ms(data.startedAt),
              endedAt: ms(data.endedAt),
              productIds: data.productIds || [],
              activeProductId: data.activeProductId,
              viewerCount: data.viewerCount || 1,
              createdAt: ms(data.createdAt),
            } as LiveSession;
          }),
        ),
      (e) => error(friendly(e)),
    );
  }

  subscribeLiveMessages(
    streamId: string,
    next: (messages: LiveChatMessage[]) => void,
    error: (s: string) => void,
  ) {
    return onSnapshot(
      query(
        collection(this.client.db, `liveStreams/${streamId}/messages`),
        orderBy("createdAt", "asc"),
      ),
      (s) =>
        next(
          s.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              streamId,
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              createdAt: ms(data.createdAt),
              isSeller: data.isSeller === true,
            } as LiveChatMessage;
          }),
        ),
      (e) => error(friendly(e)),
    );
  }
}
export function validateImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Selecciona JPG, PNG o WebP.");
  if (file.size > 2 * 1024 * 1024)
    throw new Error("La imagen debe pesar como máximo 2 MB.");
}
