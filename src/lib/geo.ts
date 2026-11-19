/**
 * Módulo de geolocalización determinista para Ventas Flash.
 * Cálculo Haversine, distritos de Lima y utilidades de privacidad geográfica.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ZoneLocation extends Coordinates {
  name: string;
  district: string;
}

export const DEFAULT_LIMA_LOCATION: ZoneLocation = {
  name: "Parque Kennedy, Miraflores",
  district: "Miraflores",
  latitude: -12.1215,
  longitude: -77.0298,
};

export const LIMA_DISTRICTS: ZoneLocation[] = [
  { name: "Miraflores (Parque Kennedy)", district: "Miraflores", latitude: -12.1215, longitude: -77.0298 },
  { name: "San Isidro (Centro Financiero)", district: "San Isidro", latitude: -12.0969, longitude: -77.0347 },
  { name: "Barranco (Puente de los Suspiros)", district: "Barranco", latitude: -12.1492, longitude: -77.0210 },
  { name: "Santiago de Surco (Chacarilla)", district: "Surco", latitude: -12.1385, longitude: -76.9950 },
  { name: "San Borja (La Rambla)", district: "San Borja", latitude: -12.0886, longitude: -77.0007 },
  { name: "Jesús María (Campo de Marte)", district: "Jesús María", latitude: -12.0725, longitude: -77.0494 },
  { name: "Magdalena del Mar (Plaza)", district: "Magdalena", latitude: -12.0910, longitude: -77.0700 },
  { name: "Lince (Parque Castilla)", district: "Lince", latitude: -12.0825, longitude: -77.0345 },
  { name: "Pueblo Libre (Plaza Bolívar)", district: "Pueblo Libre", latitude: -12.0760, longitude: -77.0650 },
  { name: "San Miguel (Plaza San Miguel)", district: "San Miguel", latitude: -12.0780, longitude: -77.0890 },
  { name: "La Molina (Molina Plaza)", district: "La Molina", latitude: -12.0860, longitude: -76.9380 },
  { name: "Centro de Lima (Plaza Mayor)", district: "Cercado de Lima", latitude: -12.0464, longitude: -77.0305 },
];

/**
 * Radio de la Tierra en kilómetros.
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Fórmula pura de Haversine para calcular la distancia ortodrómica
 * en kilómetros entre dos coordenadas geográficas.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return Infinity;
  }
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

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
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Formatea una distancia en kilómetros de manera legible para el comprador.
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "Distancia no disponible";
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 1000));
    return `a ~${meters} m`;
  }
  return `a ~${km.toFixed(1)} km`;
}

/**
 * Genera una coordenada con una ligera dispersión para proteger la privacidad
 * del vendedor (nunca expone la dirección exacta, solo una zona barrial aproximada).
 */
export function approximateCoordinates(lat: number, lon: number): Coordinates {
  // Dispersión máxima de aprox ~200-400 metros
  const offsetLat = (Math.random() - 0.5) * 0.003;
  const offsetLon = (Math.random() - 0.5) * 0.003;
  return {
    latitude: Math.round((lat + offsetLat) * 10000) / 10000,
    longitude: Math.round((lon + offsetLon) * 10000) / 10000,
  };
}
