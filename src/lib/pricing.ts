import { feeCents } from "./domain";
import type { Order } from "../model";

export const COMMISSION_PERCENT = 4;
export function sellerProceeds(price: number) {
  const gross = Math.round(price * 100);
  const fee = feeCents(gross);
  return { gross: gross / 100, fee: fee / 100, net: (gross - fee) / 100 };
}
export function orderAmounts(order: Pick<Order, "price" | "fee" | "feePayer">) {
  const price = Math.round(order.price * 100), fee = Math.round(order.fee * 100);
  return order.feePayer === "seller"
    ? { buyerTotal: price / 100, sellerNet: (price - fee) / 100 }
    : { buyerTotal: (price + fee) / 100, sellerNet: price / 100 };
}
