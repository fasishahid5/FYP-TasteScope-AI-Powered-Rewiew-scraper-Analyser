// Simple history service that manages `userHistory` in localStorage
// and dispatches a `historyUpdated` CustomEvent for in-app updates.
export const HISTORY_KEY = 'userHistory';

function read() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('historyService.read failed', e);
    return [];
  }
}

function write(arr) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    // Dispatch in-app event so components in same window can react
    try {
      window.dispatchEvent(new CustomEvent('historyUpdated', { detail: arr }));
    } catch (evErr) {
      // ignore
    }
  } catch (e) {
    console.error('historyService.write failed', e);
  }
}

function buildItem(data) {
  return {
    id: Date.now() + Math.floor(Math.random() * 9999),
    ...data,
  };
}

export function getHistory() {
  return read();
}

export function prependToHistory(items) {
  const existing = read();
  const out = [...items, ...existing];
  write(out);
  return out;
}

export function logView(restaurant) {
  const item = buildItem({
    name: restaurant.name,
    image: restaurant.image || '',
    cuisine: restaurant.cuisine || '',
    priceRange: restaurant.priceRange || '',
    rating: restaurant.rating ?? 0,
    location: restaurant.location || '',
    time: 'Just now',
    type: 'viewed',
    note: 'Viewed',
  });
  return prependToHistory([item]);
}

export function logSearch(query, count = 0) {
  const item = buildItem({
    name: `Search: ${query}`,
    image: '',
    cuisine: '',
    priceRange: '',
    rating: 0,
    location: '',
    time: 'Just now',
    type: 'searched',
    note: `Search (${count}) — ${query}`,
  });
  return prependToHistory([item]);
}

export function logCompare(arrayOfRestaurants) {
  // Build new items and remove any previous 'compared' entries for these restaurants
  const names = arrayOfRestaurants.map((r) => r.name);
  const items = arrayOfRestaurants.map((r) => buildItem({
    name: r.name,
    image: r.image || '',
    cuisine: r.cuisine || '',
    priceRange: r.priceRange || '',
    rating: r.rating ?? 0,
    location: r.location || '',
    time: 'Just now',
    type: 'compared',
    note: `Compared with: ${arrayOfRestaurants.filter(x => x.id !== r.id).map(x => x.name).join(', ')}`,
  }));

  // Remove previous compared entries for these names to avoid duplicates
  const existing = read();
  const filtered = existing.filter((it) => !(it.type === 'compared' && names.includes(it.name)));
  const out = [...items, ...filtered];
  write(out);
  return out;
}

export function clearHistory() {
  write([]);
}
