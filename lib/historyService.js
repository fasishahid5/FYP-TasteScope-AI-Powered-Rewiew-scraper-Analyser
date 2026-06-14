// Simple history service that manages `userHistory` in localStorage.
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
  const q = String(query || '').trim();
  if (q.length < 2) return read();

  const key = q.toLowerCase();
  const existing = read();
  const withoutDupes = existing.filter((h) => {
    if (h.type !== 'searched') return true;
    const prev =
      (h.query || '').trim().toLowerCase() ||
      (h.name || '').replace(/^Search:\s*/i, '').trim().toLowerCase() ||
      (h.note?.match(/—\s*(.+)$/)?.[1] || '').trim().toLowerCase();
    return prev !== key;
  });

  const item = buildItem({
    query: q,
    name: q,
    image: '',
    cuisine: '',
    priceRange: '',
    rating: 0,
    location: '',
    resultCount: count,
    time: new Date().toISOString(),
    type: 'searched',
    note: `${count} results — ${q}`,
  });

  const out = [item, ...withoutDupes];
  write(out);
  return out;
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

export function removeHistoryItem(id) {
  const existing = read();
  const out = existing.filter((item) => item.id !== id);
  write(out);
  return out;
}

export function clearHistory() {
  write([]);
}
