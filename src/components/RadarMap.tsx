import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import type { Product } from "../model";
import { money, priceAt, remaining } from "../model";
import { formatDistance, type Coordinates } from "../lib/geo";

// Configuración de iconos SVG personalizados con divIcon para evitar problemas de assets
function createProductIcon(mode: Product["mode"], isLive?: boolean) {
  let color = "#0a3622";
  let bg = "#e8f5e9";
  let iconSvg = "";
  let label = "Normal";

  if (isLive) {
    color = "#ffffff";
    bg = "#e74c3c";
    label = "EN VIVO";
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`;
  } else if (mode === "subasta") {
    color = "#0a3622";
    bg = "#b8f227";
    label = "Subasta";
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  } else if (mode === "remate") {
    color = "#ffffff";
    bg = "#e67e22";
    label = "Remate";
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
  } else {
    color = "#ffffff";
    bg = "#0a3622";
    label = "Directa";
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }

  const html = `
    <div class="radar-marker ${mode} ${isLive ? "live" : ""}" style="--marker-bg: ${bg}; --marker-color: ${color};">
      <div class="radar-marker-pin">
        ${iconSvg}
      </div>
      <div class="radar-marker-pulse"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "radar-div-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

const userLocationIcon = L.divIcon({
  html: `
    <div class="user-location-marker">
      <div class="user-pin-core"></div>
      <div class="user-pin-ring"></div>
    </div>
  `,
  className: "user-div-icon",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1], map]);
  return null;
}

interface RadarMapProps {
  userCoords: Coordinates;
  userLabel: string;
  isRealLocation: boolean;
  radiusKm: number | null;
  products: (Product & { distanceKm: number })[];
  selectedProductId?: string;
  onSelectProduct?: (p: Product) => void;
  now: number;
}

export function RadarMap({
  userCoords,
  userLabel,
  isRealLocation,
  radiusKm,
  products,
  selectedProductId,
  onSelectProduct,
  now,
}: RadarMapProps) {
  const center: [number, number] = [userCoords.latitude, userCoords.longitude];

  return (
    <div className="radar-map-wrapper">
      <MapContainer
        center={center}
        zoom={radiusKm && radiusKm <= 2 ? 14 : radiusKm && radiusKm <= 5 ? 13 : 12}
        scrollWheelZoom={true}
        className="radar-leaflet-container"
      >
        <MapRecenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> colaboradores'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Radio de proximidad */}
        {radiusKm !== null && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#7bab29",
              fillColor: "#b8f227",
              fillOpacity: 0.12,
              weight: 2,
              dashArray: "4, 6",
            }}
          />
        )}

        {/* Marcador de ubicación del usuario */}
        <Marker position={center} icon={userLocationIcon}>
          <Popup className="radar-popup user-popup">
            <div className="popup-user-content">
              <strong>{isRealLocation ? "Tu ubicación aproximada" : "Ubicación de referencia"}</strong>
              <p>{userLabel}</p>
              <small>{isRealLocation ? "Detectada con GPS del navegador" : "Zona seleccionada para explorar"}</small>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores de productos en el mapa */}
        {products.map((p) => {
          if (!p.latitude || !p.longitude) return null;
          const pos: [number, number] = [p.latitude, p.longitude];
          const isSelected = p.id === selectedProductId;
          const icon = createProductIcon(p.mode, p.isLive);

          return (
            <Marker
              key={p.id}
              position={pos}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProduct?.(p),
              }}
            >
              <Popup className="radar-popup">
                <div className="radar-popup-card">
                  {p.image && (
                    <div className="popup-thumb">
                      <img src={p.image} alt={p.title} />
                      <span className={`popup-badge ${p.mode}`}>
                        {p.isLive ? "EN DIRECTO" : p.mode === "subasta" ? "Subasta" : p.mode === "remate" ? "Remate" : "Directa"}
                      </span>
                    </div>
                  )}
                  <div className="popup-details">
                    <span className="popup-distance">{formatDistance(p.distanceKm)}</span>
                    <h4>{p.title}</h4>
                    <div className="popup-price-row">
                      <strong>{money(priceAt(p, now))}</strong>
                      {p.mode === "subasta" && (
                        <small className="popup-time">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {remaining(p.end, now)}
                        </small>
                      )}
                    </div>
                    <span className="popup-zone">{p.locationLabel || "Lima, Perú"}</span>
                    <Link to={`/producto/${p.id}`} className="popup-btn">
                      Ver producto &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
