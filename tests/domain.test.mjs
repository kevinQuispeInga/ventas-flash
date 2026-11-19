import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveBid,
  closeAuction,
  feeCents,
  descendingPrice,
  cents,
} from "../functions/lib/domain.js";
const a = () => ({
  priceCents: 105000,
  incrementCents: 5000,
  endMs: 100000,
  leaderId: null,
  winnerId: null,
  status: "active",
});
test("anti-robo: 25 segundos restantes pasan a 85", () => {
  const r = resolveBid(a(), [], "a", 110000, false, 75000);
  assert.equal(r.auction.endMs - 75000, 85000);
});
test("anti-robo en límite exacto de 30 segundos", () =>
  assert.equal(
    resolveBid(a(), [], "a", 110000, false, 70000).auction.endMs,
    160000,
  ));
test("no extiende fuera de ventana", () =>
  assert.equal(
    resolveBid(a(), [], "a", 110000, false, 69999).auction.endMs,
    100000,
  ));
test("rechaza pujas al vencer e incrementos inválidos", () => {
  assert.throws(() => resolveBid(a(), [], "a", 110000, false, 100000));
  assert.throws(() => resolveBid(a(), [], "a", 105001, false, 0));
});
test("proxy responde sin superar máximo y registra resultado acotado", () => {
  const first = resolveBid(a(), [], "a", 200000, true, 0);
  const second = resolveBid(first.auction, first.offers, "b", 150000, true, 1);
  assert.equal(second.auction.leaderId, "a");
  assert.equal(second.auction.priceCents, 155000);
  assert.equal(second.offers.length, 2);
});
test("empate resuelto por prioridad y uid, independientemente del orden", () => {
  const offers = [{ uid: "a", maxCents: 200000, priority: 0, automatic: true }];
  const r = resolveBid(
    { ...a(), leaderId: "a", priceCents: 110000 },
    offers,
    "b",
    200000,
    true,
    1,
  );
  assert.equal(r.auction.leaderId, "a");
  assert.equal(r.auction.priceCents, 200000);
});
test("máximo no puede reducirse", () => {
  assert.throws(() =>
    resolveBid(
      { ...a(), leaderId: "a" },
      [{ uid: "a", maxCents: 200000, priority: 0, automatic: true }],
      "a",
      150000,
      true,
      1,
    ),
  );
});
test("cierre idempotente, ganador y cierre prematuro", () => {
  assert.throws(() => closeAuction(a(), 99999));
  const closed = closeAuction({ ...a(), leaderId: "a" }, 100000);
  assert.equal(closed.winnerId, "a");
  assert.deepEqual(closeAuction(closed, 200000), closed);
});
test("remate respeta inicio, intervalo y mínimo incluso tras mucho tiempo", () => {
  assert.equal(descendingPrice(120000, 90000, 2000, 30000, 100, 0), 120000);
  assert.equal(descendingPrice(120000, 90000, 2000, 30000, 0, 30000), 118000);
  assert.equal(
    descendingPrice(120000, 90000, 2000, 30000, 0, 999999999),
    90000,
  );
});
test("4% calculado en céntimos; importes no finitos o con más de 2 decimales rechazados", () => {
  assert.equal(feeCents(180000), 7200);
  assert.equal(feeCents(1999), 80);
  assert.equal(cents(10.01), 1001);
  for (const n of [NaN, Infinity, -1, 0, 1.001]) assert.throws(() => cents(n));
});
test("aumentar máximo propio no provoca pujar contra uno mismo", () => {
  const first = resolveBid(a(), [], "a", 200000, true, 0);
  const second = resolveBid(first.auction, first.offers, "a", 250000, true, 1);
  assert.equal(second.auction.priceCents, first.auction.priceCents);
});
