import type { GeoJSONFeatureCollection } from "@shared/schema";

// GeoJSON data for Huruma/Mathare area in Nairobi
// Coordinates approximately centered on Huruma/Mathare
export const hurumaMathareGeoJSON: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Huruma",
        description: "Huruma residential area",
        area_type: "residential"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [36.8580, -1.2620],
          [36.8680, -1.2620],
          [36.8680, -1.2720],
          [36.8580, -1.2720],
          [36.8580, -1.2620]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mathare",
        description: "Mathare area",
        area_type: "residential"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [36.8550, -1.2550],
          [36.8650, -1.2550],
          [36.8650, -1.2620],
          [36.8550, -1.2620],
          [36.8550, -1.2550]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mathare North",
        description: "Mathare North section",
        area_type: "residential"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [36.8600, -1.2480],
          [36.8700, -1.2480],
          [36.8700, -1.2550],
          [36.8600, -1.2550],
          [36.8600, -1.2480]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Juja Road",
        description: "Main road through the area",
        road_type: "primary"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [36.8500, -1.2580],
          [36.8550, -1.2585],
          [36.8600, -1.2590],
          [36.8650, -1.2595],
          [36.8700, -1.2600],
          [36.8750, -1.2605]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Thika Road",
        description: "Thika Superhighway",
        road_type: "highway"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [36.8480, -1.2700],
          [36.8520, -1.2650],
          [36.8560, -1.2600],
          [36.8600, -1.2550],
          [36.8640, -1.2500],
          [36.8680, -1.2450]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mathare River",
        description: "Mathare River",
        water_type: "river"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [36.8520, -1.2650],
          [36.8560, -1.2640],
          [36.8600, -1.2620],
          [36.8640, -1.2590],
          [36.8680, -1.2570],
          [36.8720, -1.2560]
        ]
      }
    }
  ]
};

// Map center coordinates for Huruma/Mathare area
export const MAP_CENTER: [number, number] = [-1.2590, 36.8620];
export const MAP_ZOOM = 15;

// Helper to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Simple route optimization using nearest neighbor algorithm
export function optimizeRoute(
  shops: Array<{ latitude: number; longitude: number; id: string }>,
  startLat: number = MAP_CENTER[0],
  startLon: number = MAP_CENTER[1]
): string[] {
  if (shops.length === 0) return [];
  if (shops.length === 1) return [shops[0].id];

  const unvisited = [...shops];
  const route: string[] = [];
  let currentLat = startLat;
  let currentLon = startLon;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = unvisited[nearestIndex];
    route.push(nearest.id);
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
    unvisited.splice(nearestIndex, 1);
  }

  return route;
}

// Calculate total route distance
export function calculateRouteDistance(
  orderedShops: Array<{ latitude: number; longitude: number }>,
  startLat: number = MAP_CENTER[0],
  startLon: number = MAP_CENTER[1]
): number {
  if (orderedShops.length === 0) return 0;

  let totalDistance = calculateDistance(
    startLat,
    startLon,
    orderedShops[0].latitude,
    orderedShops[0].longitude
  );

  for (let i = 0; i < orderedShops.length - 1; i++) {
    totalDistance += calculateDistance(
      orderedShops[i].latitude,
      orderedShops[i].longitude,
      orderedShops[i + 1].latitude,
      orderedShops[i + 1].longitude
    );
  }

  return totalDistance;
}

// Estimate travel time (assuming average speed of 20 km/h in urban area)
export function estimateTravelTime(distanceKm: number): number {
  const avgSpeedKmH = 20;
  return Math.round((distanceKm / avgSpeedKmH) * 60); // return in minutes
}
