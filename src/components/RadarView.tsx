import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  SlidersHorizontal,
  Clock,
  TrendingDown,
  ShoppingBag,
  Radio,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { RadarMap } from "./RadarMap";
import {
  haversineDistance,
  formatDistance,
  DEFAULT_LIMA_LOCATION,
  LIMA_DISTRICTS,
  type Coordinates,
} from "../lib/geo";
import type { Product, Mode } from "../model";
import { money, priceAt, remaining } from "../model";

interface RadarViewProps {
  products: Product[];
  now: number;
}

type GeoState = "prompt" | "loading" | "granted" | "denied" | "error" | "demo";

export function RadarView({ products, now }: RadarViewProps) {
  // Estado de ubicación del usuario
  const [coords, setCoords] = useState<Coordinates>({
    latitude: DEFAULT_LIMA_LOCATION.latitude,
    longitude: DEFAULT_LIMA_LOCATION.longitude,
  });
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LIMA_LOCATION.name);
  const [geoState, setGeoState] = useState<GeoState>("demo");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Miraflores (Parque Kennedy)");

  // Filtros
  const [radiusKm, setRadiusKm] = useState<number | null>(5); // 5 km por defecto
  const [filterMode, setFilterMode] = useState<string>("todos");
  const [selectedProductId, setSelectedProductId] = useState<string>();

  // Intentar obtener geolocalización real si el usuario lo desea
  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationLabel("Tu ubicación actual (GPS)");
        setSelectedDistrict("gps");
        setGeoState("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoState("denied");
        } else {
          setGeoState("error");
        }
        // Conservar ubicación por defecto en Lima
        setCoords({
          latitude: DEFAULT_LIMA_LOCATION.latitude,
          longitude: DEFAULT_LIMA_LOCATION.longitude,
        });
        setLocationLabel(DEFAULT_LIMA_LOCATION.name);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  // Cambio manual de distrito
  function handleDistrictChange(name: string) {
    if (name === "gps") {
      requestLocation();
      return;
    }
    const found = LIMA_DISTRICTS.find((d) => d.name === name);
    if (found) {
      setCoords({ latitude: found.latitude, longitude: found.longitude });
      setLocationLabel(found.name);
      setSelectedDistrict(found.name);
      setGeoState("demo");
    }
  }

  // Calcular distancias y filtrar productos
  const nearbyProducts = useMemo(() => {
    return products
      .filter((p) => p.status === "active" || !p.status)
      .map((p) => {
        const lat = p.latitude ?? DEFAULT_LIMA_LOCATION.latitude;
        const lon = p.longitude ?? DEFAULT_LIMA_LOCATION.longitude;
        const distanceKm = haversineDistance(
          coords.latitude,
          coords.longitude,
          lat,
          lon
        );
        return {
          ...p,
          latitude: lat,
          longitude: lon,
          distanceKm,
        };
      })
      .filter((p) => {
        // Filtro por radio
        if (radiusKm !== null && p.distanceKm > radiusKm) return false;
        // Filtro por modalidad
        if (filterMode === "directo") return p.isLive === true;
        if (filterMode !== "todos" && p.mode !== filterMode) return false;
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [products, coords.latitude, coords.longitude, radiusKm, filterMode]);

  return (
    <main className="radar-page">
      {/* Encabezado del Radar */}
      <section className="radar-header">
        <div className="radar-title-group">
          <span className="eyebrow lime-chip">
            <Compass size={14} /> RADAR FLASH EN VIVO
          </span>
          <h1>Oportunidades cerca de ti</h1>
          <p>
            Encuentra subastas contrarreloj, remates y compras directas en tu zona.
            Coordina entregas rápidas y seguras de persona a persona en Lima.
          </p>
        </div>

        {/* Barra de estado de geolocalización */}
        <div className={`radar-location-bar ${geoState}`}>
          <div className="location-info">
            <MapPin size={18} />
            <div>
              <strong>{locationLabel}</strong>
              <small>
                {geoState === "granted"
                  ? "Ubicación detectada por dispositivo (aproximada)"
                  : geoState === "denied"
                    ? "Permiso denegado · Mostrando zona de referencia en Lima"
                    : geoState === "loading"
                      ? "Buscando tu ubicación aproximada..."
                      : "Zona de exploración (Ubicación simulada de referencia)"}
              </small>
            </div>
          </div>

          <div className="location-actions">
            <select
              aria-label="Seleccionar distrito de Lima"
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              <option value="gps">📡 Detectar mi ubicación GPS</option>
              <optgroup label="Distritos de Lima">
                {LIMA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            </select>

            {geoState !== "granted" && (
              <button
                type="button"
                className="button-radar-gps"
                onClick={requestLocation}
                title="Detectar ubicación actual"
              >
                <RefreshCw size={15} /> Usar GPS
              </button>
            )}
          </div>
        </div>

        {/* Filtros de proximidad y modalidad */}
        <div className="radar-controls">
          <div className="radius-selector">
            <span className="filter-label">Radio de búsqueda:</span>
            {[1, 2, 3, 5, 10].map((km) => (
              <button
                key={km}
                type="button"
                className={`radius-pill ${radiusKm === km ? "active" : ""}`}
                onClick={() => setRadiusKm(km)}
              >
                {km} km
              </button>
            ))}
            <button
              type="button"
              className={`radius-pill ${radiusKm === null ? "active" : ""}`}
              onClick={() => setRadiusKm(null)}
            >
              Todos
            </button>
          </div>

          <div className="mode-selector">
            <span className="filter-label">Modalidad:</span>
            {[
              { id: "todos", label: "Todas" },
              { id: "subasta", label: "Subastas" },
              { id: "remate", label: "Remates" },
              { id: "normal", label: "Compra directa" },
              { id: "directo", label: "En directo" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mode-pill ${filterMode === m.id ? "active" : ""}`}
                onClick={() => setFilterMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenedor principal: Mapa interactivo + Lista lateral */}
      <section className="radar-layout">
        {/* Mapa Leaflet */}
        <div className="radar-map-column">
          <RadarMap
            userCoords={coords}
            userLabel={locationLabel}
            isRealLocation={geoState === "granted"}
            radiusKm={radiusKm}
            products={nearbyProducts}
            selectedProductId={selectedProductId}
            onSelectProduct={(p) => setSelectedProductId(p.id)}
            now={now}
          />
          <div className="radar-map-legend">
            <span><i className="legend-dot subasta" /> Subasta</span>
            <span><i className="legend-dot remate" /> Remate</span>
            <span><i className="legend-dot normal" /> Compra directa</span>
            <span><i className="legend-dot directo" /> En directo</span>
            <span><i className="legend-dot user" /> Tu centro</span>
          </div>
        </div>

        {/* Lista de oportunidades cercanas */}
        <aside className="radar-results-column">
          <div className="radar-results-header">
            <h3>
              {nearbyProducts.length} {nearbyProducts.length === 1 ? "hallazgo" : "hallazgos"} cerca
            </h3>
            <small>
              {radiusKm ? `Dentro de ${radiusKm} km de ${locationLabel.split("(")[0]}` : "Todas las distancias"}
            </small>
          </div>

          <div className="radar-product-list">
            {!nearbyProducts.length ? (
              <div className="radar-empty">
                <AlertCircle size={36} />
                <h4>No hay productos dentro de este radio</h4>
                <p>Prueba ampliando tu radio de búsqueda a 5 km o 10 km para ver más oportunidades.</p>
                <div className="form-row">
                  <button className="button primary" onClick={() => setRadiusKm(10)}>
                    Ampliar a 10 km
                  </button>
                  <button className="button" onClick={() => setRadiusKm(null)}>
                    Ver todos los distritos
                  </button>
                </div>
              </div>
            ) : (
              nearbyProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <article
                    key={p.id}
                    className={`radar-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <div className="item-thumb">
                      {p.image ? (
                        <img src={p.image} alt={p.title} />
                      ) : (
                        <div className="thumb-placeholder">{p.title[0]}</div>
                      )}
                      <span className={`badge-mini ${p.mode}`}>
                        {p.isLive ? (
                          <Radio size={11} />
                        ) : p.mode === "subasta" ? (
                          <Clock size={11} />
                        ) : p.mode === "remate" ? (
                          <TrendingDown size={11} />
                        ) : (
                          <ShoppingBag size={11} />
                        )}
                        {p.isLive ? "EN VIVO" : p.mode === "subasta" ? "Subasta" : p.mode === "remate" ? "Remate" : "Directa"}
                      </span>
                    </div>

                    <div className="item-info">
                      <div className="item-top-meta">
                        <span className="distance-chip">
                          <MapPin size={12} /> {formatDistance(p.distanceKm)}
                        </span>
                        <span className="district-label">{p.locationLabel || "Lima"}</span>
                      </div>

                      <h4>{p.title}</h4>

                      <div className="item-price-row">
                        <div>
                          <strong>{money(priceAt(p, now))}</strong>
                          {p.original > p.price && <del>{money(p.original)}</del>}
                        </div>
                        {p.mode === "subasta" && (
                          <span className="time-left">
                            <Clock size={12} /> {remaining(p.end, now)}
                          </span>
                        )}
                      </div>

                      <div className="item-card-actions">
                        <span className="seller-name">
                          <ShieldCheck size={13} /> {p.seller}
                        </span>
                        <Link to={`/producto/${p.id}`} className="view-link">
                          Ver detalle <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
