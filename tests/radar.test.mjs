import assert from "node:assert/strict";
import { test } from "node:test";
import {
  haversineDistance,
  formatDistance,
  approximateCoordinates,
  DEFAULT_LIMA_LOCATION,
  LIMA_DISTRICTS,
} from "../src/lib/geo.ts";
import { haversineDistance as backendHaversine } from "../src/lib/domain.ts";

// Coordenadas conocidas de referencia en Lima
const MIRAFLORES = { lat: -12.1215, lon: -77.0298 };
const SAN_ISIDRO = { lat: -12.0969, lon: -77.0347 };
const BARRANCO = { lat: -12.1492, lon: -77.0210 };
const SURCO = { lat: -12.1385, lon: -76.9950 };
const CENTRO_LIMA = { lat: -12.0464, lon: -77.0305 };

test("Haversine: distancia exacta entre puntos conocidos de Lima", () => {
  // Miraflores a San Isidro (~2.78 km)
  const d1 = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, SAN_ISIDRO.lat, SAN_ISIDRO.lon);
  assert.ok(d1 >= 2.7 && d1 <= 2.9, `Esperado ~2.78 km, obtenido ${d1}`);

  // Miraflores a Barranco (~3.22 km)
  const d2 = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, BARRANCO.lat, BARRANCO.lon);
  assert.ok(d2 >= 3.1 && d2 <= 3.3, `Esperado ~3.22 km, obtenido ${d2}`);

  // Miraflores a Surco (~4.24 km)
  const d3 = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, SURCO.lat, SURCO.lon);
  assert.ok(d3 >= 4.1 && d3 <= 4.4, `Esperado ~4.24 km, obtenido ${d3}`);

  // Miraflores a Centro de Lima (~8.36 km)
  const d4 = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, CENTRO_LIMA.lat, CENTRO_LIMA.lon);
  assert.ok(d4 >= 8.2 && d4 <= 8.5, `Esperado ~8.36 km, obtenido ${d4}`);
});

test("Haversine: identidad y simetría", () => {
  // Misma coordenada da 0
  assert.equal(haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, MIRAFLORES.lat, MIRAFLORES.lon), 0);

  // Simetría: d(A, B) === d(B, A)
  const ab = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, SAN_ISIDRO.lat, SAN_ISIDRO.lon);
  const ba = haversineDistance(SAN_ISIDRO.lat, SAN_ISIDRO.lon, MIRAFLORES.lat, MIRAFLORES.lon);
  assert.equal(ab, ba);
});

test("Haversine: paridad matemática estricta entre frontend y backend", () => {
  const frontDist = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, BARRANCO.lat, BARRANCO.lon);
  const backDist = backendHaversine(MIRAFLORES.lat, MIRAFLORES.lon, BARRANCO.lat, BARRANCO.lon);
  assert.equal(frontDist, backDist);
});

test("Haversine: manejo seguro de coordenadas inválidas o no finitas", () => {
  assert.equal(haversineDistance(NaN, 0, 0, 0), Infinity);
  assert.equal(haversineDistance(0, Infinity, 0, 0), Infinity);
  assert.equal(haversineDistance(-12, -77, null, -77), Infinity);
});

test("formatDistance: formato legible para distancias cortas y largas", () => {
  assert.equal(formatDistance(0.25), "a ~250 m");
  assert.equal(formatDistance(0.04), "a ~50 m"); // Mínimo 50m
  assert.equal(formatDistance(1.42), "a ~1.4 km");
  assert.equal(formatDistance(5.08), "a ~5.1 km");
  assert.equal(formatDistance(-1), "Distancia no disponible");
  assert.equal(formatDistance(Infinity), "Distancia no disponible");
});

test("Filtros de proximidad: clasificación en anillos de 1km, 2km, 3km, 5km y 10km", () => {
  const products = [
    { id: "p-cerca", lat: -12.1220, lon: -77.0300 }, // ~0.06 km (dentro de 1 km)
    { id: "p-san-isidro", lat: -12.0969, lon: -77.0347 }, // ~2.78 km (dentro de 3 km y 5 km)
    { id: "p-surco", lat: -12.1385, lon: -76.9950 }, // ~4.24 km (dentro de 5 km y 10 km)
    { id: "p-centro", lat: -12.0464, lon: -77.0305 }, // ~8.36 km (dentro de 10 km)
    { id: "p-lejos", lat: -11.9500, lon: -77.0500 }, // ~19.1 km (fuera de 10 km)
  ];

  const filterRadius = (radiusKm) =>
    products.filter((p) => haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, p.lat, p.lon) <= radiusKm);

  assert.equal(filterRadius(1).length, 1);
  assert.equal(filterRadius(1)[0].id, "p-cerca");

  assert.equal(filterRadius(2).length, 1); // San Isidro está a 2.78km, no entra en 2km
  assert.equal(filterRadius(3).length, 2); // p-cerca y p-san-isidro
  assert.equal(filterRadius(5).length, 3); // suma p-surco
  assert.equal(filterRadius(10).length, 4); // suma p-centro
});

test("Zonas de Lima: distritos válidos y coordenadas dentro del territorio metropolitano", () => {
  assert.ok(LIMA_DISTRICTS.length >= 10);
  for (const d of LIMA_DISTRICTS) {
    assert.ok(d.name && d.district);
    // Latitud de Lima: entre -11.5 y -12.5
    assert.ok(d.latitude < -11.5 && d.latitude > -12.5, `Latitud inválida para ${d.name}: ${d.latitude}`);
    // Longitud de Lima: entre -76.5 y -77.5
    assert.ok(d.longitude < -76.5 && d.longitude > -77.5, `Longitud inválida para ${d.name}: ${d.longitude}`);
  }
});

test("Ubicación por defecto: Miraflores como fallback seguro y transparente", () => {
  assert.equal(DEFAULT_LIMA_LOCATION.district, "Miraflores");
  assert.equal(DEFAULT_LIMA_LOCATION.latitude, -12.1215);
  assert.equal(DEFAULT_LIMA_LOCATION.longitude, -77.0298);
});

test("approximateCoordinates: genera dispersión controlada (< 350m) y redondeo a 4 decimales", () => {
  for (let i = 0; i < 20; i++) {
    const approx = approximateCoordinates(MIRAFLORES.lat, MIRAFLORES.lon);
    assert.ok(Number.isFinite(approx.latitude));
    assert.ok(Number.isFinite(approx.longitude));
    // Precisión acotada a máximo 4 decimales
    const latDecimals = approx.latitude.toString().split(".")[1]?.length || 0;
    const lonDecimals = approx.longitude.toString().split(".")[1]?.length || 0;
    assert.ok(latDecimals <= 4, `Latitud tiene más de 4 decimales: ${approx.latitude}`);
    assert.ok(lonDecimals <= 4, `Longitud tiene más de 4 decimales: ${approx.longitude}`);
    // Distancia debe ser menor a 0.35 km (~350 metros) respecto al centroide
    const dist = haversineDistance(MIRAFLORES.lat, MIRAFLORES.lon, approx.latitude, approx.longitude);
    assert.ok(dist < 0.35, `Dispersión excesiva: ${dist} km`);
  }
});
