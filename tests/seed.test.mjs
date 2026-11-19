import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { haversineDistance, DEFAULT_LIMA_LOCATION, LIMA_DISTRICTS } from "../src/lib/geo.ts";

// Compilar dinámicamente el generador de datos semilla y DemoService
const bundleSeed = await build({
  entryPoints: ["src/data/seedData.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});

const {
  SEED_USERS,
  DEFAULT_TEST_PASSWORD,
  getSeedProducts,
  getSeedLiveStreams,
  getSeedLiveMessages,
  getSeedOrders,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundleSeed.outputFiles[0].text).toString("base64")
);

const bundleDemo = await build({
  entryPoints: ["src/services/demo.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});

const { DemoService } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundleDemo.outputFiles[0].text).toString("base64")
);

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
  clear: () => memory.clear(),
};

function snapshot(service) {
  let value;
  const stop = service.subscribe((s) => (value = s));
  stop();
  return value;
}

test("SEED: 15 usuarios peruanos (6 vendedores y 9 compradores) con atributos válidos", () => {
  assert.equal(SEED_USERS.length, 15, "Deben existir exactamente 15 usuarios");

  const sellers = SEED_USERS.filter((u) => u.role === "vendedor");
  const buyers = SEED_USERS.filter((u) => u.role === "comprador");

  assert.equal(sellers.length, 6, "Deben existir exactamente 6 vendedores");
  assert.equal(buyers.length, 9, "Deben existir exactamente 9 compradores");

  assert.equal(DEFAULT_TEST_PASSWORD, "Password123!", "Contraseña universal debe ser Password123!");

  const userIds = new Set();
  const emails = new Set();

  for (const u of SEED_USERS) {
    assert.ok(u.id, "ID de usuario requerido");
    assert.ok(!userIds.has(u.id), `ID duplicado: ${u.id}`);
    userIds.add(u.id);

    assert.ok(u.email.endsWith("@ventasflash.pe"), `Email debe pertenecer al dominio local: ${u.email}`);
    assert.ok(!emails.has(u.email), `Email duplicado: ${u.email}`);
    emails.add(u.email);

    assert.equal(u.emailVerified, true, "Email debe estar verificado");
    assert.equal(u.status, "active", "Usuario debe estar activo");
    assert.equal(typeof u.identityVerified, "boolean", "Usuario debe tener campo de verificación booleano");
    assert.ok(u.district, "Debe tener distrito de Lima asignado");
    assert.ok(u.avatarUrl.startsWith("http"), "Debe tener avatar");
    assert.ok(u.bio.length > 10, "Debe tener biografía descriptiva");
  }

  const verified = SEED_USERS.filter((u) => u.identityVerified);
  const unverified = SEED_USERS.filter((u) => !u.identityVerified);
  assert.ok(verified.length >= 6, "Deben haber usuarios verificados");
  assert.ok(unverified.length >= 3, "Deben haber usuarios no verificados para pruebas de confianza");
});

test("SEED: 60 productos catalogados en Soles (S/) y distribuidos en 10+ categorías", () => {
  const now = Date.now();
  const products = getSeedProducts(now);

  assert.equal(products.length, 60, "Deben existir exactamente 60 productos");

  // Distribución por modalidades
  const normal = products.filter((p) => p.mode === "normal");
  const subastas = products.filter((p) => p.mode === "subasta");
  const remates = products.filter((p) => p.mode === "remate");

  assert.equal(normal.length, 25, "Deben existir 25 ventas normales");
  assert.equal(subastas.length, 25, "Deben existir 25 subastas");
  assert.equal(remates.length, 10, "Deben existir 10 remates descendentes");

  // Estados de subastas
  const activeSubastas = subastas.filter((p) => p.status === "active" && p.end > now);
  const scheduledSubastas = subastas.filter((p) => p.status === "active" && p.bids.length === 0 && p.created > now - 60000);
  const closedSubastas = subastas.filter((p) => p.status === "closed" || p.end <= now);

  assert.ok(activeSubastas.length >= 15, "Deben haber al menos 15 subastas activas");
  assert.ok(closedSubastas.length >= 5, "Deben haber al menos 5 subastas cerradas");

  // Categorías
  const categories = new Set(products.map((p) => p.category));
  assert.ok(categories.size >= 10, `Deben existir al menos 10 categorías (actual: ${categories.size})`);

  for (const p of products) {
    assert.ok(p.id, "ID requerido");
    assert.ok(p.title.length > 5, "Título descriptivo requerido");
    assert.ok(p.description.length > 15, "Descripción completa requerida");
    assert.ok(p.image.startsWith("http"), "Imagen requerida");
    assert.ok(p.price > 0, "Precio positivo requerido");
    assert.ok(p.seller, "Nombre de vendedor requerido");
    assert.ok(p.sellerId, "ID de vendedor requerido");
  }
});

test("SEED: Cobertura geográfica completa de los 12 distritos de Lima y anillos Radar Flash", () => {
  const products = getSeedProducts();

  const districtOccurrences = new Set();
  const coreDistricts = ["Miraflores", "San Isidro", "Barranco", "Surco"];
  let coreCount = 0;

  for (const p of products) {
    assert.ok(Number.isFinite(p.latitude), "Latitud finita requerida");
    assert.ok(Number.isFinite(p.longitude), "Longitud finita requerida");
    assert.ok(p.latitude < -12.0 && p.latitude > -12.3, "Latitud dentro de Lima Metropolitana");
    assert.ok(p.longitude < -76.8 && p.longitude > -77.2, "Longitud dentro de Lima Metropolitana");

    const distName = p.locationLabel.replace(", Lima", "").trim();
    districtOccurrences.add(distName);

    if (coreDistricts.some((cd) => distName.includes(cd))) {
      coreCount++;
    }
  }

  // Verificar presencia de los 12 distritos de LIMA_DISTRICTS
  for (const ld of LIMA_DISTRICTS) {
    assert.ok(
      districtOccurrences.has(ld.district),
      `El distrito ${ld.district} debe estar representado en el catálogo de productos`
    );
  }

  // Verificar concentración en distritos centrales (>= 50%)
  assert.ok(
    coreCount >= 30,
    `Mayor densidad requerida en distritos centrales (Miraflores, San Isidro, Barranco, Surco): ${coreCount}/60`
  );

  // Probar anillos de distancia Haversine desde Miraflores (Parque Kennedy)
  const distances = products.map((p) =>
    haversineDistance(
      DEFAULT_LIMA_LOCATION.latitude,
      DEFAULT_LIMA_LOCATION.longitude,
      p.latitude,
      p.longitude
    )
  );

  const ring1km = distances.filter((d) => d <= 1);
  const ring3km = distances.filter((d) => d <= 3);
  const ring5km = distances.filter((d) => d <= 5);
  const ring10km = distances.filter((d) => d <= 10);
  const beyond10km = distances.filter((d) => d > 10);

  assert.ok(ring1km.length > 0, "Debe haber productos dentro del anillo de 1 km");
  assert.ok(ring3km.length >= ring1km.length, "Anillo de 3 km debe contener más productos");
  assert.ok(ring10km.length > ring5km.length, "Anillo de 10 km debe contener más productos");
  assert.ok(beyond10km.length > 0, "Debe haber productos a más de 10 km (ej. La Molina, Cercado de Lima)");
});

test("SEED: 5 transmisiones Flash Live e integridad de chat público", () => {
  const streams = getSeedLiveStreams();
  assert.equal(streams.length, 5, "Deben existir exactamente 5 transmisiones Flash Live");

  const live = streams.filter((s) => s.status === "live");
  const scheduled = streams.filter((s) => s.status === "scheduled");
  const ended = streams.filter((s) => s.status === "ended");

  assert.equal(live.length, 2, "Deben haber 2 transmisiones en vivo");
  assert.equal(scheduled.length, 2, "Deben haber 2 transmisiones programadas");
  assert.equal(ended.length, 1, "Deben haber 1 transmisión finalizada");

  const liveMessages = getSeedLiveMessages();
  assert.ok(Object.keys(liveMessages).length >= 2, "Debe haber mensajes de chat para transmisiones");

  for (const s of streams) {
    assert.ok(s.id, "ID de stream requerido");
    assert.ok(s.title.length > 5, "Título descriptivo");
    assert.ok(s.sellerId, "Vendedor anfitrión requerido");
    assert.ok(s.productIds.length > 0, "Debe vincular productos del catálogo");
  }
});

test("SEED: Integridad referencial completa entre usuarios, productos, subastas y órdenes", () => {
  const users = new Map(SEED_USERS.map((u) => [u.id, u]));
  const products = new Map(getSeedProducts().map((p) => [p.id, p]));
  const streams = getSeedLiveStreams();
  const orders = getSeedOrders();

  // Cada vendedor de producto debe ser un usuario válido
  for (const p of products.values()) {
    assert.ok(users.has(p.sellerId), `Vendedor de producto no existe: ${p.sellerId}`);
    for (const b of p.bids) {
      if (b.bidderId) {
        assert.ok(users.has(b.bidderId), `Pujador de producto no existe: ${b.bidderId}`);
      }
    }
    if (p.leaderId) {
      assert.ok(users.has(p.leaderId), `Líder de subasta no existe: ${p.leaderId}`);
    }
  }

  // Cada anfitrión de Flash Live debe ser un usuario vendedor válido
  for (const s of streams) {
    assert.ok(users.has(s.sellerId), `Anfitrión no existe: ${s.sellerId}`);
    for (const pid of s.productIds) {
      assert.ok(products.has(pid), `Producto en stream no existe en catálogo: ${pid}`);
    }
  }

  // Cada orden debe tener participantes válidos
  for (const o of orders) {
    assert.ok(users.has(o.buyerId), `Comprador de orden no existe: ${o.buyerId}`);
    assert.ok(users.has(o.sellerId), `Vendedor de orden no existe: ${o.sellerId}`);
    assert.ok(products.has(o.productId), `Producto de orden no existe: ${o.productId}`);
    assert.ok(Math.abs(o.fee - o.price * 0.04) < 0.1, "Tarifa de servicio del 4% en soles");
  }
});

test("SEED: DemoService seedDemoData pobla 60 productos, es idempotente y resetDemoData limpia", () => {
  memory.clear();
  const s = new DemoService();

  // Estado limpio inicial (4 productos estándar para backward-compatibility)
  assert.equal(snapshot(s).state.products.length, 4);

  // Poblar SEED explícitamente
  s.seedDemoData(true);
  const snap1 = snapshot(s);
  assert.equal(snap1.state.products.length, 60, "Debe tener 60 productos tras seed");
  assert.equal(snap1.state.liveStreams.length, 5, "Debe tener 5 transmisiones tras seed");
  assert.equal(snap1.state.orders.length, 1, "Marta debe ver su orden de compra");
  assert.equal(s.state.orders.length, 2, "Debe tener 2 órdenes registradas en el estado global");

  // Idempotencia: llamar seed de nuevo sin force no duplica ni corrompe
  s.seedDemoData(false);
  const snap2 = snapshot(s);
  assert.equal(snap2.state.products.length, 60, "Idempotente: sigue teniendo 60 productos");

  // Cambio de usuario a cualquiera de los 15 usuarios SEED
  s.switchDemo("usr-seller-diego");
  assert.equal(snapshot(s).user.name, "Diego Rodríguez");

  s.switchDemo("usr-buyer-sofia");
  assert.equal(snapshot(s).user.name, "Sofía Alarcón");

  // Restablecer datos (Reset)
  s.resetDemoData();
  const snapReset = snapshot(s);
  assert.equal(snapReset.state.products.length, 4, "Debe volver a los 4 productos iniciales limpios");
  assert.equal(snapReset.user.name, "Marta", "Usuario vuelve al predeterminado Marta");
});
