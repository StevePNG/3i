import type { Coordinates } from '../data/locations';

const EARTH_RADIUS_KM = 6371;

export const haversineDistanceKm = (a: Coordinates, b: Coordinates) => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
};

export const formatDistance = (distanceKm: number) =>
  `${distanceKm.toFixed(1)} km`;

export const formatEta = (minutes: number) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
};

export const averageEtaMinutes = (distanceKm: number, averageSpeedKmh = 35) =>
  (distanceKm / averageSpeedKmh) * 60;

export const generateCoordinatesFromLabel = (label: string): Coordinates => {
  const baseLat = 37.7749;
  const baseLon = -122.4194;
  const hash = Array.from(label).reduce((sum, char, index) => {
    return sum + char.charCodeAt(0) * (index + 1);
  }, 0);

  const latOffset = ((hash % 200) - 100) / 1000; // ±0.1 deg (~11km)
  const lonOffset = ((hash % 260) - 130) / 1000; // ±0.13 deg

  return {
    latitude: baseLat + latOffset,
    longitude: baseLon + lonOffset
  };
};
