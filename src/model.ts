export type Mode = "subasta" | "remate" | "normal";
export type Product = {
  sellerId?: string;
  sellerVerified?: boolean;
  status?: "active" | "closed" | "sold" | "reserved";
  leaderId?: string | null;
  winnerId?: string | null;
  id: string;
  title: string;
  category: string;
  mode: Mode;
  price: number;
  original: number;
  floor: number;
  step: number;
  created: number;
  end: number;
  image: string;
  seller: string;
  description: string;
  bids: { name: string; amount: number; time: number; bidderId?: string }[];
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  locationVisibility?: "approximate" | "exact" | "hidden";
  isLive?: boolean;
};
export type Order = {
  buyerId?: string;
  sellerId?: string;
  status?: import("./types/marketplace").TransactionStatus;
  provider?: "demo";
  id: string;
  productId: string;
  title: string;
  price: number;
  fee: number;
  feePayer?: "buyer" | "seller";
  received: boolean;
  messages: { text: string; mine: boolean; senderId?: string; time?: number }[];
};
export type LiveSession = {
  id: string;
  title: string;
  description: string;
  sellerId: string;
  sellerName: string;
  sellerVerified?: boolean;
  status: "scheduled" | "live" | "ended";
  startedAt?: number;
  endedAt?: number;
  productIds: string[];
  activeProductId?: string;
  viewerCount: number;
  thumbnailUrl?: string;
  createdAt: number;
};
export type LiveChatMessage = {
  id: string;
  streamId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
  isSeller?: boolean;
};
export type State = {
  products: Product[];
  favorites: string[];
  orders: Order[];
  liveStreams: LiveSession[];
};
export const money = (n: number) =>
  "S/ " +
  n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export const priceAt = (p: Product, now: number) =>
  p.mode === "remate"
    ? Math.max(
        p.floor,
        p.price - Math.floor(Math.max(0, now - p.created) / 30000) * p.step,
      )
    : p.price;
export const remaining = (end: number, now: number) => {
  const s = Math.max(0, Math.ceil((end - now) / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};
export function initial(): State {
  const now = Date.now();
  return {
    favorites: [],
    orders: [],
    products: [
      {
        id: "macbook",
        title: "MacBook Air M1",
        category: "Tecnología",
        mode: "subasta",
        price: 1050,
        original: 2400,
        floor: 1050,
        step: 50,
        created: now,
        end: now + 180000,
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=85",
        seller: "Diego R.",
        description:
          "Chip M1 · 8 GB RAM · SSD 256 GB. Ligera, potente y lista para acompañarte. En excelente estado, incluye cargador original. Entrega en Miraflores, Lima.",
        bids: [],
        latitude: -12.1215,
        longitude: -77.0298,
        locationLabel: "Miraflores, Lima",
        locationVisibility: "approximate",
      },
      {
        id: "iphone",
        title: "iPhone 15",
        category: "Tecnología",
        mode: "remate",
        price: 1200,
        original: 2200,
        floor: 900,
        step: 20,
        created: now,
        end: now + 86400000,
        image:
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=85",
        seller: "Camila P.",
        description:
          "128 GB · Desbloqueado para todos los operadores. Muy bien cuidado, batería al 94%. Incluye cable y caja. Entrega coordinada en Lima.",
        bids: [],
        latitude: -12.0969,
        longitude: -77.0347,
        locationLabel: "San Isidro, Lima",
        locationVisibility: "approximate",
      },
      {
        id: "guitarra",
        title: "Guitarra acústica",
        category: "Música",
        mode: "remate",
        price: 320,
        original: 650,
        floor: 220,
        step: 5,
        created: now,
        end: now + 86400000,
        image:
          "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=900&auto=format&fit=crop&q=85",
        seller: "Andrés M.",
        description:
          "Sonido cálido, cuerdas nuevas y cuerpo de madera. Ideal para aprender o volver a tocar tus canciones favoritas. Incluye funda acolchada.",
        bids: [],
        latitude: -12.1492,
        longitude: -77.0210,
        locationLabel: "Barranco, Lima",
        locationVisibility: "approximate",
      },
      {
        id: "sony",
        title: "Cámara Sony Alpha",
        category: "Fotografía",
        mode: "normal",
        price: 1800,
        original: 2600,
        floor: 1800,
        step: 0,
        created: now,
        end: now + 86400000,
        image:
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&auto=format&fit=crop&q=85",
        seller: "Lucía V.",
        description:
          "Sony Alpha con lente 16–50 mm. Sensor impecable y poco uso. Incluye batería, cargador y correa. Lista para tu próxima aventura.",
        bids: [],
        latitude: -12.1385,
        longitude: -76.9950,
        locationLabel: "Surco, Lima",
        locationVisibility: "approximate",
      },
    ],
    liveStreams: [
      {
        id: "live-demo-1",
        title: "TecnoFlash Live: Subasta de MacBook y Gadgets de Lima",
        description: "En vivo probando la MacBook Air M1 y respondiendo preguntas de compradores en tiempo real.",
        sellerId: "seller",
        sellerName: "Diego R.",
        sellerVerified: true,
        status: "live",
        startedAt: now - 300000,
        productIds: ["macbook", "iphone"],
        activeProductId: "macbook",
        viewerCount: 24,
        createdAt: now - 600000,
      },
    ],
  };
}
export const KEY = "ventas-flash-v1";
export function read(): State {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      v &&
      Array.isArray(v.products) &&
      Array.isArray(v.orders) &&
      Array.isArray(v.favorites)
    ) {
      if (!Array.isArray(v.liveStreams)) {
        v.liveStreams = initial().liveStreams;
      }
      return v;
    }
  } catch {}
  return initial();
}
