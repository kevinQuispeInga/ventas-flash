export type TransactionStatus =
  | "pending"
  | "payment_confirmed"
  | "payment_held"
  | "delivery_pending"
  | "receipt_confirmed"
  | "release_requested"
  | "completed"
  | "cancelled";
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: "active" | "suspended";
  identityVerified: boolean;
}
export interface IdentityVerification {
  userId: string;
  status: "pending" | "approved" | "rejected";
  providerReference: string | null;
}
export interface PaymentMethod {
  userId: string;
  provider: string;
  tokenReference: string;
  last4: string;
  brand: string;
} // Never PAN or CVV.
export interface ProductDocument {
  sellerId: string;
  title: string;
  description: string;
  mode: "subasta" | "remate" | "normal";
  category: string;
  image: string;
  status: "active" | "reserved" | "sold" | "closed";
  priceCents: number;
  createdAt: unknown;
}
export interface AuctionDocument {
  productId: string;
  sellerId: string;
  priceCents: number;
  incrementCents: number;
  leaderId: string | null;
  winnerId: string | null;
  endAt: unknown;
  status: "active" | "closed";
}
export interface BidDocument {
  auctionId: string;
  bidderId: string;
  amountCents: number;
  createdAt: unknown;
  automatic: boolean;
}
export interface AutoBidDocument {
  auctionId: string;
  uid: string;
  maxCents: number;
  priority: number;
  automatic: boolean;
}
export interface DescendingSale {
  productId: string;
  initialCents: number;
  floorCents: number;
  stepCents: number;
  intervalMs: number;
  startAt: unknown;
}
export interface TransactionDocument {
  productId: string;
  buyerId: string;
  sellerId: string;
  participants: string[];
  priceCents: number;
  feeCents: number;
  status: TransactionStatus;
  provider: "demo";
  createdAt: unknown;
}
export interface EscrowPayment {
  transactionId: string;
  participants: string[];
  provider: "demo";
  amountCents: number;
  status: TransactionStatus;
  realFundsHeld: false;
}
export interface Delivery {
  transactionId: string;
  participants: string[];
  status: "pending" | "received";
  receivedAt: unknown | null;
}
export interface Conversation {
  transactionId: string;
  participants: string[];
  createdAt: unknown;
}
export interface MessageDocument {
  senderId: string;
  text: string;
  createdAt: unknown;
}
export interface Favorite {
  userId: string;
  productId: string;
}
export interface Notification {
  userId: string;
  text: string;
  read: boolean;
  createdAt: unknown;
}
export interface LiveStream {
  sellerId: string;
  productId: string;
  status: "scheduled" | "live" | "ended";
  url: string;
}
export interface Review {
  transactionId: string;
  authorId: string;
  recipientId: string;
  rating: number;
  text: string;
}
