import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { build } from "esbuild";

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
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

beforeEach(() => {
  storage.clear();
});

test("Flash Live DEMO: ciclo de vida de la transmisión (crear, iniciar, cambiar producto, finalizar)", async () => {
  const service = new DemoService();
  await service.switchDemo("Marta");

  // Marta crea un producto
  const pid = await service.createProduct({
    id: "prod-live-" + Date.now(),
    title: "Micrófono Shure SM7B",
    description: "Ideal para podcast y directos en Lima.",
    category: "Música",
    mode: "subasta",
    price: 900,
    image: "",
  });

  // Marta crea la sesión Flash Live
  const streamId = await service.createLiveStream(
    "Especial de Audio Profesional",
    "Probando micrófonos en directo con subastas activas.",
    [pid]
  );
  assert.ok(streamId.startsWith("live-"));

  let snap = service.snapshot();
  let stream = snap.state.liveStreams.find((s) => s.id === streamId);
  assert.ok(stream);
  assert.equal(stream.status, "scheduled");
  assert.equal(stream.sellerId, "demo-marta");
  assert.equal(stream.activeProductId, pid);

  // Marta inicia la transmisión
  await service.startLiveStream(streamId);
  snap = service.snapshot();
  stream = snap.state.liveStreams.find((s) => s.id === streamId);
  assert.equal(stream.status, "live");
  assert.ok(stream.startedAt > 0);

  // El producto debe estar marcado como isLive: true
  const prod = snap.state.products.find((p) => p.id === pid);
  assert.equal(prod.isLive, true);

  // Marta finaliza la transmisión
  await service.endLiveStream(streamId);
  snap = service.snapshot();
  stream = snap.state.liveStreams.find((s) => s.id === streamId);
  assert.equal(stream.status, "ended");
  assert.ok(stream.endedAt > 0);

  // La subasta del producto sigue activa (no se cierra prematuramente)
  const prodAfter = snap.state.products.find((p) => p.id === pid);
  assert.equal(prodAfter.status, "active");
  assert.equal(prodAfter.isLive, false);
});

test("Flash Live DEMO: chat público en directo e identificación de anfitrión", async () => {
  const service = new DemoService();
  await service.switchDemo("Carlos");

  // Carlos (comprador) envía mensaje en el directo demo
  await service.sendLiveChatMessage("live-demo-1", "¿Haces envíos a San Borja?");

  let receivedMessages = [];
  const unsub = service.subscribeLiveMessages("live-demo-1", (msgs) => {
    receivedMessages = msgs;
  });

  const lastMsg = receivedMessages[receivedMessages.length - 1];
  assert.equal(lastMsg.text, "¿Haces envíos a San Borja?");
  assert.equal(lastMsg.senderName, "Carlos");
  assert.equal(lastMsg.isSeller, false);

  unsub();
});

test("Flash Live DEMO: comprador puede pujar en el producto activo del directo", async () => {
  const service = new DemoService();
  await service.switchDemo("Marta");

  // Marta (compradora) puja en la MacBook de la sesión en vivo demo
  const result = await service.bid("macbook", 1150);
  assert.equal(typeof result.extended, "boolean");

  const snap = service.snapshot();
  const macbook = snap.state.products.find((p) => p.id === "macbook");
  assert.equal(macbook.price, 1150);
  assert.equal(macbook.bids[0].name, "Marta");
});

test("Flash Live DEMO: seguridad: usuario no anfitrión no puede iniciar ni finalizar directo ajeno", async () => {
  const service = new DemoService();
  await service.switchDemo("Carlos");

  // Carlos intenta iniciar el directo de Diego (live-demo-1)
  await assert.rejects(
    service.startLiveStream("live-demo-1"),
    /Solo el anfitrión/
  );

  await assert.rejects(
    service.endLiveStream("live-demo-1"),
    /Solo el anfitrión/
  );
});
