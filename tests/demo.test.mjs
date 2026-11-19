import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { build } from "esbuild";
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear(),
};
const bundle = await build({
  entryPoints: ["src/services/demo.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { DemoService } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
function snapshot(service) {
  let value;
  const stop = service.subscribe((s) => (value = s));
  stop();
  return value;
}
beforeEach(() => memory.clear());
test("DEMO conserva cuatro productos, precios iniciales y favoritos tras recargar servicio", async () => {
  const s = new DemoService();
  assert.equal(snapshot(s).state.products.length, 4);
  assert.equal(snapshot(s).state.products[0].price, 1050);
  await s.toggleFavorite("sony");
  assert.deepEqual(snapshot(new DemoService()).state.favorites, ["sony"]);
});
test("DEMO publica, compra con otro usuario, chat bilateral y recepción persistida", async () => {
  const s = new DemoService();
  const id = await s.createProduct({
    id: "new",
    title: "Prueba",
    description: "Prueba DEMO",
    category: "Otros",
    mode: "normal",
    price: 100,
    image: "",
  });
  await assert.rejects(s.purchase(id, 100));
  await s.switchDemo("Carlos");
  const orderId = await s.purchase(id, 100);
  let o = snapshot(s).state.orders[0];
  assert.equal(o.fee, 4);
  await s.sendMessage(orderId, "Hola Marta");
  await s.switchDemo("Marta");
  let messages;
  const stop = s.subscribeMessages(orderId, (m) => (messages = m));
  assert.equal(messages.at(-1).mine, false);
  stop();
  await assert.rejects(s.confirmReceipt(orderId));
  await s.switchDemo("Carlos");
  await s.confirmReceipt(orderId);
  assert.equal(snapshot(new DemoService()).state.orders[0].received, true);
});
test("DEMO auto-puja y rechazo de puja del vendedor", async () => {
  const s = new DemoService();
  await s.bid("macbook", 1500, true);
  assert.equal(snapshot(s).state.products[0].price, 1100);
  await s.switchDemo("Carlos");
  await assert.rejects(s.bid("macbook", 1600));
  await s.logout();
  assert.equal(snapshot(s).user, null);
  assert.equal(snapshot(s).state.orders.length, 0);
  await assert.rejects(s.toggleFavorite("sony"));
});
test("DEMO migra datos fase 1 sin perder pedidos ni favoritos", () => {
  const s = new DemoService();
  const old = snapshot(s).state;
  old.products = old.products.map(({ sellerId, status, ...p }) => p);
  old.orders = [
    {
      id: "old-order",
      productId: "sony",
      title: "Cámara",
      price: 1800,
      fee: 72,
      received: false,
      messages: [],
    },
  ];
  old.favorites = ["sony"];
  // A phase-1 browser has only the original key, no per-user phase-2 stores.
  memory.clear();
  memory.set("ventas-flash-v1", JSON.stringify(old));
  const migrated = snapshot(new DemoService());
  assert.equal(migrated.state.orders[0].buyerId, "demo-marta");
  assert.equal(migrated.state.products[0].sellerId, "demo-carlos");
  assert.deepEqual(migrated.state.favorites, ["sony"]);
});
test("DEMO nombre de perfil persiste y respeta el usuario seleccionado", async () => {
  const s = new DemoService();
  await s.updateProfile("Marta Perú");
  await s.switchDemo("Carlos");
  assert.equal(snapshot(s).user.name, "Carlos");
  await s.switchDemo("Marta");
  assert.equal(snapshot(new DemoService()).user.name, "Marta Perú");
});
test("DEMO persiste el inicio de los contadores antes de cualquier interacción", () => {
  const s = new DemoService();
  const saved = JSON.parse(memory.get("ventas-flash-v1"));
  assert.equal(saved.products[0].end, snapshot(s).state.products[0].end);
  assert.equal(
    snapshot(new DemoService()).state.products[0].end,
    saved.products[0].end,
  );
});
