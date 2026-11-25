import { UserFacingError } from "../lib/errors";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseClient } from "../lib/supabase";
import { validateImage } from "../lib/images";
import type { MarketplaceService, ProductInput, Snapshot } from "./contracts";
import { friendly } from "./contracts";
import type { Product, Order, LiveSession, LiveChatMessage } from "../model";

type Row = Record<string, any>;
const ms = (v: string | null) => v ? Date.parse(v) : 0;
const empty = () => ({ products: [], orders: [], favorites: [], liveStreams: [] });
export function mapProduct(d: Row, client: SupabaseClient): Product {
  return {
    id: d.id, title: d.title, description: d.description, category: d.category, mode: d.mode,
    price: (d.mode === "remate" ? d.original_cents : d.price_cents) / 100,
    original: d.original_cents / 100, floor: d.floor_cents / 100, step: d.step_cents / 100,
    created: ms(d.created_at), end: ms(d.end_at),
    image: d.image_path ? (d.image_path.startsWith("http") ? d.image_path : client.storage.from("products").getPublicUrl(d.image_path).data.publicUrl) : "",
    seller: d.seller_name, sellerId: d.seller_id, sellerVerified: d.seller_verified,
    status: d.status, leaderId: d.leader_id, winnerId: d.winner_id, bids: [],
    latitude: d.latitude == null ? undefined : Number(d.latitude),
    longitude: d.longitude == null ? undefined : Number(d.longitude),
    locationLabel: d.location_label, locationVisibility: d.location_visibility, isLive: d.is_live,
  };
}
export const mapLive = (d: Row): LiveSession => ({
  id: d.id, title: d.title, description: d.description, sellerId: d.seller_id,
  sellerName: d.seller_name, sellerVerified: d.seller_verified, status: d.status,
  productIds: d.product_ids, activeProductId: d.active_product_id,
  viewerCount: d.viewer_count, startedAt: ms(d.started_at), endedAt: ms(d.ended_at), createdAt: ms(d.created_at),
});

// Fetch again after subscribing/reconnecting to close the initial snapshot race.
// Polling also recovers missed changes and DELETE events filtered by RLS.
export function watchRows(
  client: SupabaseClient, table: string, load: () => PromiseLike<{ data: any; error: any }>,
  next: (rows: Row[]) => void, error: (message: string) => void,
  filter?: string,
) {
  let alive = true, running = false, pending = false;
  async function refresh() {
    if (!alive) return;
    if (running) { pending = true; return; }
    running = true;
    try {
      const result = await load();
      if (alive) {
        if (result.error) error(friendly(result.error));
        else next(result.data || []);
      }
    } catch (e) { if (alive) error(friendly(e)); }
    finally { running = false; if (pending) { pending = false; void refresh(); } }
  }
  const channel = client.channel(`${table}:${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, () => { void refresh(); })
    .subscribe(status => {
      if (!alive) return;
      if (status === "SUBSCRIBED") void refresh();
      else if (status === "TIMED_OUT") error(friendly({ code: "request_timeout" }));
      else if (status === "CHANNEL_ERROR" || status === "CLOSED") error(friendly({ code: "econnreset" }));
    });
  void refresh();
  const timer = setInterval(() => { void refresh(); }, 15000);
  return () => { alive = false; clearInterval(timer); void client.removeChannel(channel); };
}

export class SupabaseService implements MarketplaceService {
  readonly mode = "supabase";
  constructor(private client: SupabaseClient = supabaseClient()) {}
  private snapshot: Snapshot = { state: empty(), user: null, loading: true, error: "", clockOffset: 0 };
  private listeners = new Set<(s: Snapshot) => void>();
  private stops: (() => void)[] = [];
  private privateStops: (() => void)[] = [];
  private generation = 0;
  private sessionUser: User | null = null;
  private emit = () => { for (const next of this.listeners) next(this.snapshot); };
  private error = (message: string) => { this.snapshot = { ...this.snapshot, error: message, loading: false }; this.emit(); };
  private state(patch: Partial<Snapshot["state"]>) {
    this.snapshot = { ...this.snapshot, state: { ...this.snapshot.state, ...patch } }; this.emit();
  }
  private async rpc<T = any>(name: string, args?: Row): Promise<T> {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new UserFacingError(friendly(error));
    return data as T;
  }
  subscribe(next: (s: Snapshot) => void) {
    this.listeners.add(next); next(this.snapshot);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(next);
      if (!this.listeners.size) {
        this.generation++;
        [...this.stops, ...this.privateStops].forEach(stop => stop());
        this.stops = []; this.privateStops = [];
      }
    };
  }
  private start() {
    this.stops.push(watchRows(this.client, "products", () => this.client.from("products").select("*").order("created_at", { ascending: false }),
      rows => this.state({ products: rows.map(d => mapProduct(d, this.client)) }), this.error));
    this.stops.push(this.subscribeLiveStreams(rows => this.state({ liveStreams: rows }), this.error));
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      // Never await Supabase calls inside the auth callback (the auth lock is held).
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/restablecer") {
        // Defer navigation until the auth client has finished persisting the session.
        setTimeout(() => window.location.replace(`${window.location.origin}/restablecer`), 0);
      }
      const nextUserId = session?.user?.id || null;
      if (this.sessionUser?.id && this.sessionUser.id === nextUserId && this.snapshot.user !== null) {
        this.sessionUser = session?.user || null;
        return;
      }
      const generation = ++this.generation;
      this.privateStops.forEach(stop => stop()); this.privateStops = [];
      this.sessionUser = session?.user || null;
      this.snapshot = { ...this.snapshot, user: null, state: { ...this.snapshot.state, favorites: [], orders: [] } };
      this.emit();
      setTimeout(() => { if (this.listeners.size && generation === this.generation) this.bindUser(session?.user || null, generation); }, 0);
    });
    this.stops.push(() => data.subscription.unsubscribe());
    const started = Date.now();
    void this.rpc<number>("server_time").then(now => {
      if (!this.listeners.size) return;
      this.snapshot = { ...this.snapshot, clockOffset: now - (started + Date.now()) / 2 }; this.emit();
    }).catch(e => this.error(friendly(e)));
  }
  private bindUser(user: User | null, generation: number) {
    if (!user) { this.snapshot = { ...this.snapshot, loading: false }; this.emit(); return; }
    const valid = () => generation === this.generation && this.listeners.size > 0;
    this.privateStops.push(watchRows(this.client, "profiles", () => this.client.from("profiles").select("*").eq("id", user.id), rows => {
      if (!valid()) return;
      const p = rows[0];
      if (!p) { this.error("No pudimos cargar tu perfil. Vuelve a iniciar sesión. Si continúa, contacta con soporte."); return; }
      this.snapshot = { ...this.snapshot, loading: false, error: "", user: {
        id: user.id, name: p.name, email: user.email || "", emailVerified: !!user.email_confirmed_at,
        status: p.status, identityVerified: p.identity_verified,
      } }; this.emit();
    }, this.error, `id=eq.${user.id}`));
    this.privateStops.push(watchRows(this.client, "favorites", () => this.client.from("favorites").select("product_id").eq("user_id", user.id), rows => {
      if (valid()) this.state({ favorites: rows.map(d => d.product_id) });
    }, this.error, `user_id=eq.${user.id}`));
    this.privateStops.push(watchRows(this.client, "orders", () => this.client.from("orders").select("*").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }), rows => {
      if (valid()) this.state({ orders: rows.map(d => ({ id: d.id, productId: d.id, title: d.title,
        price: d.price_cents / 100, fee: d.fee_cents / 100, feePayer: d.fee_payer || "buyer", received: d.status === "completed",
        status: d.status, buyerId: d.buyer_id, sellerId: d.seller_id, provider: "demo", messages: [] })) });
    }, this.error));
  }
  async login(email: string, password: string) {
    const { error } = await this.client.auth.signInWithPassword({ email, password }); if (error) throw error;
  }
  async register(name: string, email: string, password: string) {
    if (password.length < 8) throw new UserFacingError("Usa al menos 8 caracteres.");
    const { error } = await this.client.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/perfil` } });
    if (error) throw error;
  }
  async logout() { const { error } = await this.client.auth.signOut(); if (error) throw error; }
  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` }); if (error) throw error;
  }
  async updatePassword(password: string) {
    if (password.length < 8) throw new UserFacingError("Usa al menos 8 caracteres.");
    const { error } = await this.client.auth.updateUser({ password }); if (error) throw error;
  }
  async verifyEmail() {
    const email = this.sessionUser?.email; if (!email) throw new UserFacingError("Inicia sesión.");
    const { error } = await this.client.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/perfil` } }); if (error) throw error;
  }
  async refreshUser() { const { error } = await this.client.auth.refreshSession(); if (error) throw error; }
  async updateProfile(name: string) { await this.rpc("update_profile", { p_name: name }); }
  async switchDemo() { throw new UserFacingError("Las cuentas de demostración solo existen en modo demo."); }
  async toggleFavorite(id: string) {
    const uid = this.sessionUser?.id; if (!uid) throw new UserFacingError("Inicia sesión.");
    const removing = this.snapshot.state.favorites.includes(id);
    const { error } = removing
      ? await this.client.from("favorites").delete().eq("user_id", uid).eq("product_id", id)
      : await this.client.from("favorites").insert({ user_id: uid, product_id: id });
    if (error) throw error;
    if (this.sessionUser?.id === uid) this.state({ favorites: removing ? this.snapshot.state.favorites.filter(x => x !== id) : [...new Set([...this.snapshot.state.favorites, id])] });
  }
  async createProduct(input: ProductInput) {
    const uid = this.sessionUser?.id; if (!uid) throw new UserFacingError("Inicia sesión.");
    let imagePath = "";
    if (input.file) {
      validateImage(input.file); imagePath = `${uid}/${input.id}/main`;
      const { error } = await this.client.storage.from("products").upload(imagePath, input.file, { contentType: input.file.type }); if (error) throw error;
    }
    const { file: _file, image: _image, ...data } = input;
    try { return await this.rpc<string>("create_product", { p_data: { ...data, imagePath } }); }
    catch (e) {
      // A network timeout may follow a committed RPC; never delete an image used by a product.
      const existing = await this.client.from("products").select("id").eq("id", input.id).maybeSingle();
      if (imagePath && !existing.error && !existing.data) await this.client.storage.from("products").remove([imagePath]);
      throw e;
    }
  }
  async editProduct(id: string, title: string, description: string) { await this.rpc("edit_product", { p_id: id, p_title: title, p_description: description }); }
  async bid(id: string, amount: number, automatic = false) { return this.rpc<{ extended: boolean }>("place_bid", { p_id: id, p_amount: amount, p_automatic: automatic, p_request_id: crypto.randomUUID() }); }
  async closeAuction(id: string) { await this.rpc("close_auction", { p_id: id }); }
  async purchase(id: string, maxPrice: number) { return this.rpc<string>("purchase_with_seller_commission", { p_id: id, p_max_price: maxPrice }); }
  async confirmReceipt(id: string) { await this.rpc("confirm_receipt", { p_id: id }); }
  async sendMessage(id: string, text: string) { await this.rpc("send_message", { p_id: id, p_text: text }); }
  subscribeBids(id: string, next: (bids: Product["bids"]) => void, error: (s: string) => void) {
    return watchRows(this.client, "bids", () => this.client.from("bids").select("*").eq("product_id", id).order("created_at", { ascending: false }), rows => next(rows.map(d => ({
      name: d.bidder_id === this.sessionUser?.id ? "Tú" : `Participante ${d.bidder_id.slice(-4)}`,
      bidderId: d.bidder_id, amount: d.amount_cents / 100, time: ms(d.created_at),
    }))), error, `product_id=eq.${id}`);
  }
  subscribeMessages(id: string, next: (messages: Order["messages"]) => void, error: (s: string) => void) {
    return watchRows(this.client, "messages", () => this.client.from("messages").select("*").eq("order_id", id).order("created_at"), rows => next(rows.map(d => ({
      text: d.text, mine: d.sender_id === this.sessionUser?.id, senderId: d.sender_id, time: ms(d.created_at),
    }))), error, `order_id=eq.${id}`);
  }
  subscribeAutoBid(id: string, next: (n: number | null) => void, error: (s: string) => void) {
    const uid = this.sessionUser?.id; if (!uid) { next(null); return () => {}; }
    return watchRows(this.client, "auto_bids", () => this.client.from("auto_bids").select("max_cents,automatic").eq("product_id", id).eq("user_id", uid),
      rows => next(rows[0]?.automatic ? rows[0].max_cents / 100 : null), error, `product_id=eq.${id}`);
  }
  async createLiveStream(title: string, description: string, productIds: string[]) { return this.rpc<string>("create_live_stream", { p_title: title, p_description: description, p_product_ids: productIds }); }
  async startLiveStream(id: string) { await this.rpc("update_live_stream", { p_id: id, p_action: "start" }); }
  async endLiveStream(id: string) { await this.rpc("update_live_stream", { p_id: id, p_action: "end" }); }
  async setFeaturedLiveProduct(id: string, productId: string) { await this.rpc("update_live_stream", { p_id: id, p_action: "feature", p_product_id: productId }); }
  async sendLiveChatMessage(id: string, text: string) { await this.rpc("send_live_message", { p_id: id, p_text: text }); }
  subscribeLiveStreams(next: (s: LiveSession[]) => void, error: (s: string) => void) {
    return watchRows(this.client, "live_streams", () => this.client.from("live_streams").select("*").order("created_at", { ascending: false }), rows => next(rows.map(mapLive)), error);
  }
  subscribeLiveMessages(id: string, next: (m: LiveChatMessage[]) => void, error: (s: string) => void) {
    return watchRows(this.client, "live_messages", () => this.client.from("live_messages").select("*").eq("stream_id", id).order("created_at"), rows => next(rows.map(d => ({
      id: String(d.id), streamId: d.stream_id, senderId: d.sender_id, senderName: d.sender_name, text: d.text, createdAt: ms(d.created_at), isSeller: d.is_seller,
    }))), error, `stream_id=eq.${id}`);
  }
}
