/** Pure, deterministic rules. Monetary values are integer PEN cents. */
export const MAX_CENTS = 100_000_000;
export function cents(value: number): number {
  const n = Math.round(value * 100);
  if (
    !Number.isFinite(value) ||
    n < 100 ||
    n > MAX_CENTS ||
    Math.abs(n - value * 100) > 0.001
  )
    throw new Error(
      "Importe inválido (mínimo S/ 1; máximo S/ 1,000,000; dos decimales).",
    );
  return n;
}
export function feeCents(price: number) {
  return Math.round((price * 4) / 100);
}
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return Infinity;
  }
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371 * c * 100) / 100;
}
export function descendingPrice(
  initial: number,
  floor: number,
  step: number,
  interval: number,
  start: number,
  now: number,
) {
  return Math.max(
    floor,
    initial - Math.floor(Math.max(0, now - start) / interval) * step,
  );
}
export type Offer = {
  uid: string;
  maxCents: number;
  priority: number;
  automatic: boolean;
};
export type AuctionState = {
  priceCents: number;
  incrementCents: number;
  endMs: number;
  leaderId: string | null;
  status: "active" | "closed";
  winnerId: string | null;
};
export function resolveBid(
  a: AuctionState,
  offers: Offer[],
  uid: string,
  maxCents: number,
  automatic: boolean,
  now: number,
) {
  if (a.status !== "active" || now >= a.endMs)
    throw new Error("La subasta ya cerró.");
  if (
    !Number.isSafeInteger(maxCents) ||
    maxCents > MAX_CENTS ||
    maxCents < a.priceCents + a.incrementCents
  )
    throw new Error(
      "El importe debe superar la puja actual por el incremento mínimo.",
    );
  const existing = offers.find((x) => x.uid === uid);
  if (existing && maxCents < existing.maxCents)
    throw new Error("No puedes reducir una oferta comprometida.");
  const next = [
    ...offers.filter((x) => x.uid !== uid),
    { uid, maxCents, automatic, priority: existing?.priority ?? now },
  ];
  if (next.length > 100)
    throw new Error("Se alcanzó el límite de 100 participantes por subasta.");
  const ranked = [...next].sort(
    (x, y) =>
      y.maxCents - x.maxCents ||
      x.priority - y.priority ||
      x.uid.localeCompare(y.uid),
  );
  const first = ranked[0],
    second = ranked[1];
  // A manual offer commits its full amount. A proxy only pays enough to beat the runner-up.
  const base = automatic
    ? a.leaderId === uid
      ? a.priceCents
      : a.priceCents + a.incrementCents
    : maxCents;
  const competitive = second
    ? Math.min(first.maxCents, second.maxCents + a.incrementCents)
    : base;
  const priceCents = Math.max(
    a.priceCents,
    Math.min(first.maxCents, Math.max(base, competitive)),
  );
  return {
    auction: {
      ...a,
      priceCents,
      leaderId: first.uid,
      endMs: a.endMs - now <= 30_000 ? a.endMs + 60_000 : a.endMs,
    },
    offers: next,
    extended: a.endMs - now <= 30_000,
  };
}
export function closeAuction(a: AuctionState, now: number) {
  if (a.status === "closed") return a;
  if (now < a.endMs) throw new Error("La subasta sigue abierta.");
  return { ...a, status: "closed" as const, winnerId: a.leaderId };
}
