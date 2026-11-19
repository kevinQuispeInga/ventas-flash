import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { firebaseClient } from "../lib/firebase";
import type {
  IdentityVerification,
  PaymentMethod,
  Notification,
  LiveStream,
  Review,
  EscrowPayment,
  Delivery,
  Conversation,
} from "../types/firestore";
import { friendly } from "./contracts";
export type RecordWithId<T> = T & { id: string };
/** Additional modeled collections are read-only until their business workflows exist. */
export function subscribePrivateRecords<
  T extends IdentityVerification | PaymentMethod | Notification,
>(
  name: "identityVerifications" | "paymentMethods" | "notifications",
  next: (items: RecordWithId<T>[]) => void,
  error: (message: string) => void,
) {
  const { db, auth } = firebaseClient();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    next([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, name), where("userId", "==", uid)),
    (s) =>
      next(s.docs.map((d) => ({ ...d.data(), id: d.id }) as RecordWithId<T>)),
    (e) => error(friendly(e)),
  );
}
export function subscribeTransactionRecord<
  T extends EscrowPayment | Delivery | Conversation,
>(
  name: "escrowPayments" | "deliveries" | "conversations",
  id: string,
  next: (item: RecordWithId<T> | null) => void,
  error: (message: string) => void,
) {
  return onSnapshot(
    doc(firebaseClient().db, name, id),
    (s) =>
      next(s.exists() ? ({ ...s.data(), id: s.id } as RecordWithId<T>) : null),
    (e) => error(friendly(e)),
  );
}
export function subscribeProductExtras<T extends LiveStream | Review>(
  name: "liveStreams" | "reviews",
  field: "productId" | "recipientId",
  id: string,
  next: (items: RecordWithId<T>[]) => void,
  error: (message: string) => void,
) {
  return onSnapshot(
    query(collection(firebaseClient().db, name), where(field, "==", id)),
    (s) =>
      next(s.docs.map((d) => ({ ...d.data(), id: d.id }) as RecordWithId<T>)),
    (e) => error(friendly(e)),
  );
}
