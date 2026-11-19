import type { State, Product, Order, LiveSession, LiveChatMessage } from "../model";
import type { UserProfile } from "../types/firestore";
export type ProductInput = {
  id: string;
  title: string;
  description: string;
  category: string;
  mode: Product["mode"];
  price: number;
  image: string;
  file?: File;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  locationVisibility?: "approximate" | "exact" | "hidden";
  isLive?: boolean;
};
export type Snapshot = {
  state: State;
  user: UserProfile | null;
  loading: boolean;
  error: string;
  clockOffset: number;
};
export interface MarketplaceService {
  mode: "demo" | "firebase";
  subscribe(next: (snapshot: Snapshot) => void): () => void;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(): Promise<void>;
  refreshUser(): Promise<void>;
  updateProfile(name: string): Promise<void>;
  switchDemo(name: string): Promise<void>;
  seedDemoData?: (force?: boolean) => void;
  resetDemoData?: () => void;
  toggleFavorite(id: string): Promise<void>;
  createProduct(input: ProductInput): Promise<string>;
  editProduct(id: string, title: string, description: string): Promise<void>;
  bid(
    id: string,
    amount: number,
    automatic?: boolean,
  ): Promise<{ extended: boolean }>;
  purchase(id: string, maxPrice: number): Promise<string>;
  confirmReceipt(id: string): Promise<void>;
  sendMessage(id: string, text: string): Promise<void>;
  subscribeBids(
    id: string,
    next: (bids: Product["bids"]) => void,
    error: (message: string) => void,
  ): () => void;
  subscribeMessages(
    id: string,
    next: (messages: Order["messages"]) => void,
    error: (message: string) => void,
  ): () => void;
  subscribeAutoBid(
    id: string,
    next: (amount: number | null) => void,
    error: (message: string) => void,
  ): () => void;
  closeAuction(id: string): Promise<void>;
  createLiveStream(title: string, description: string, productIds: string[]): Promise<string>;
  startLiveStream(streamId: string): Promise<void>;
  endLiveStream(streamId: string): Promise<void>;
  setFeaturedLiveProduct(streamId: string, productId: string): Promise<void>;
  sendLiveChatMessage(streamId: string, text: string): Promise<void>;
  subscribeLiveStreams(
    next: (streams: LiveSession[]) => void,
    error: (message: string) => void,
  ): () => void;
  subscribeLiveMessages(
    streamId: string,
    next: (messages: LiveChatMessage[]) => void,
    error: (message: string) => void,
  ): () => void;
}
export function friendly(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/weak-password": "Usa al menos 8 caracteres.",
    "auth/invalid-email": "Correo inválido.",
    "auth/too-many-requests": "Demasiados intentos. Prueba más tarde.",
    "auth/network-request-failed":
      "No se pudo conectar. Comprueba tu conexión.",
    "permission-denied": "No tienes acceso a estos datos.",
    unavailable:
      "Servicio no disponible. Comprueba la conexión o los emuladores.",
  };
  return (
    (code && messages[code]) ||
    (error instanceof Error
      ? error.message
      : "No se pudo completar la operación.")
  );
}
