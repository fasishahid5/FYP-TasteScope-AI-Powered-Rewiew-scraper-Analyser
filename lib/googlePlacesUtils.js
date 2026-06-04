export const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
];

export const DEFAULT_MAP_CENTER = { lat: 31.5204, lng: 74.3587 };

/** Pakistan bounding box for filtering Places results */
export function isInPakistan(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }
  return lat >= 23.63 && lat <= 37.09 && lng >= 60.87 && lng <= 77.84;
}

/** Search/nearby anchor: user coords only if inside Pakistan, else Lahore */
export function getPakistanSearchCenter(coords) {
  if (coords && isInPakistan(coords.lat, coords.lng)) return coords;
  return DEFAULT_MAP_CENTER;
}

export function filterPakistanPlaces(places) {
  if (!Array.isArray(places)) return [];
  return places.filter((place) => {
    const lat = place.geometry?.location?.lat?.() ?? place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng?.() ?? place.geometry?.location?.lng;
    return isInPakistan(lat, lng);
  });
}

const LOCATION_ONLY_TYPES = new Set([
  'locality',
  'political',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'administrative_area_level_4',
  'geocode',
  'country',
  'postal_code',
  'route',
  'intersection',
  'neighborhood',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
]);

const RESTAURANT_TYPES = new Set([
  'restaurant',
  'food',
  'cafe',
  'meal_takeaway',
  'meal_delivery',
  'bakery',
  'bar',
  'night_club',
]);

function hasRestaurantType(types = []) {
  return types.some((t) => RESTAURANT_TYPES.has(t));
}

function isLocationOnly(types = []) {
  if (!types.length) return false;
  return types.every(
    (t) =>
      LOCATION_ONLY_TYPES.has(t) ||
      t.startsWith('administrative_area') ||
      t === 'political'
  );
}

/** Autocomplete row: drop cities/regions (e.g. Nowshera when typing Novu) */
export function isRestaurantPrediction(prediction) {
  const types = prediction?.types || [];
  if (isLocationOnly(types)) return false;
  if (types.includes('locality') && !hasRestaurantType(types)) return false;
  if (hasRestaurantType(types)) return true;
  if (types.includes('establishment') && types.includes('point_of_interest')) return true;
  return types.includes('establishment') && !types.includes('locality');
}

export function filterRestaurantPredictions(predictions) {
  if (!Array.isArray(predictions)) return [];
  return predictions.filter(isRestaurantPrediction);
}

/** Place result from nearby/text search */
export function isRestaurantPlace(place) {
  const types = place?.types || [];
  if (isLocationOnly(types)) return false;
  if (types.includes('locality') && !hasRestaurantType(types)) return false;
  if (hasRestaurantType(types)) return true;
  return types.includes('establishment') || types.includes('point_of_interest');
}

export function filterRestaurantPlaces(places) {
  if (!Array.isArray(places)) return [];
  return places.filter(isRestaurantPlace);
}

export function formatPredictionLabel(prediction) {
  const name =
    prediction.structured_formatting?.main_text ||
    prediction.description?.split(',')[0]?.trim() ||
    '';
  const location =
    prediction.structured_formatting?.secondary_text ||
    prediction.description?.split(',').slice(1).join(',').trim() ||
    '';
  return { name, location };
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function mockSentiment(placeId) {
  const id = String(placeId || '');
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return 58 + Math.abs(h % 38);
}

function formatCuisine(types) {
  const skip = new Set(['establishment', 'point_of_interest', 'food', 'restaurant']);
  const raw = types?.find((t) => !skip.has(t)) || 'restaurant';
  return raw.replace(/_/g, ' ');
}

function getPhotoUrl(place, idx) {
  try {
    return place.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 });
  } catch {
    return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
  }
}

export function mapGooglePlaceToRestaurant(place, idx, userLocation) {
  const lat = place.geometry?.location?.lat?.() ?? place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng?.() ?? place.geometry?.location?.lng;
  const placeId = place.place_id || `place-${idx}`;
  const sentiment = mockSentiment(placeId);

  const restaurant = {
    id: placeId,
    name: place.name || 'Restaurant',
    location: place.formatted_address || place.vicinity || '',
    rating: place.rating || 4.0,
    sentiment,
    reviews: place.user_ratings_total || 300 + idx * 47,
    cuisine: formatCuisine(place.types),
    priceRange: place.price_level ? '$'.repeat(Math.min(place.price_level, 4)) : '$$',
    waitTime: 10 + (idx % 5) * 5,
    waitTimeLabel: `${10 + (idx % 5) * 5}–${15 + (idx % 5) * 5} min`,
    image: getPhotoUrl(place, idx) || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
    lat,
    lng,
    status: place.opening_hours?.open_now ? 'Open' : 'Open',
  };

  if (userLocation && typeof lat === 'number' && typeof lng === 'number') {
    restaurant.distance = distanceKm(userLocation.lat, userLocation.lng, lat, lng);
  }

  return restaurant;
}
