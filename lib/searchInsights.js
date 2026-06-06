import { getHistory, HISTORY_KEY } from './historyService';

const SEARCH_STATS_KEY = 'ts_searchStats';
const MAX_HISTORY_SEARCH_ITEMS = 40;

/** Pakistan-focused popular searches (shown when no personal stats yet) */
const CURATED_TRENDING = [
  { label: 'Biryani', query: 'biryani' },
  { label: 'BBQ', query: 'bbq restaurant' },
  { label: 'Karahi', query: 'karahi' },
  { label: 'Fast Food', query: 'fast food' },
  { label: 'Pizza', query: 'pizza' },
  { label: 'Café', query: 'cafe lahore' },
  { label: 'Chinese', query: 'chinese restaurant' },
  { label: 'Desi', query: 'desi restaurant' },
];

function readStats() {
  try {
    const raw = localStorage.getItem(SEARCH_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStats(stats) {
  try {
    localStorage.setItem(SEARCH_STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

function readHistoryRaw() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistoryRaw(arr) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('historyUpdated', { detail: arr }));
  } catch {
    // ignore
  }
}

const GENERIC_SEARCH_TERMS = /\b(restaurant|resto|food|cafe|shawarma|eatery|kitchen|diner|grill|bar|shop|biryani|bbq|pizza|fast|near|nearby)\b/gi;

function normalizeSearchKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/([a-z])\s+(\d)/g, '$1$2')
    .replace(/(\d)\s+([a-z])/g, '$1$2')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchKeyBase(value) {
  return normalizeSearchKey(value)
    .replace(GENERIC_SEARCH_TERMS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseQueryFromItem(item) {
  if (item.query?.trim()) return item.query.trim();
  const fromNote = item.note?.match(/—\s*(.+)$/);
  if (fromNote?.[1]) return fromNote[1].trim();
  const fromName = (item.name || '').replace(/^Search:\s*/i, '').trim();
  return fromName || '';
}

function parseResultCount(item) {
  if (typeof item.resultCount === 'number') return item.resultCount;
  const m = item.note?.match(/Search\s*\((\d+)\)/i) || item.note?.match(/^(\d+)\s+results?/i);
  return m ? parseInt(m[1], 10) : null;
}

function capitalizeQuery(q) {
  if (!q) return '';
  return q.charAt(0).toUpperCase() + q.slice(1);
}

/** Log a completed search (deduped, updates trending stats)
 * @param {string} query - The search query
 * @param {number} resultCount - Number of results found
 * @param {Object} selectedRestaurant - Optional selected restaurant details
 */
export function logSearchQuery(query, resultCount = 0, selectedRestaurant = null) {
  const q = String(query || '').trim();
  if (q.length < 2) return;

  const normalized = normalizeSearchKey(q);
  if (normalized.length < 2) return;
  const normalizedBase = normalizeSearchKeyBase(q);

  const stats = readStats();
  stats[normalized] = (stats[normalized] || 0) + 1;
  writeStats(stats);

  const now = new Date().toISOString();
  const existing = readHistoryRaw();
  const withoutDupes = existing.filter((h) => {
    if (h.type !== 'searched') return true;
    const prevQuery = parseQueryFromItem(h);
    const prevNormalized = normalizeSearchKey(prevQuery);
    const prevBase = normalizeSearchKeyBase(prevQuery);
    return prevNormalized !== normalized && prevBase !== normalizedBase;
  });

  const entry = {
    id: Date.now() + Math.floor(Math.random() * 9999),
    type: 'searched',
    query: q,
    name: selectedRestaurant?.name || q,
    resultCount,
    time: now,
    note: `${resultCount} results — ${q}`,
    cuisine: selectedRestaurant?.cuisine || '',
    priceRange: selectedRestaurant?.priceRange || '',
    rating: selectedRestaurant?.rating ?? 0,
    location: selectedRestaurant?.location || '',
    sentiment: selectedRestaurant?.sentiment ?? 0,
    reviews: selectedRestaurant?.reviews ?? 0,
    image: selectedRestaurant?.image || '',
  };

  writeHistoryRaw([entry, ...withoutDupes].slice(0, MAX_HISTORY_SEARCH_ITEMS + 50));
}

/** Unique recent searches, newest first */
export function getRecentSearchQueries(limit = 6) {
  const seen = new Set();
  const out = [];

  for (const item of getHistory()) {
    if (item.type !== 'searched') continue;
    const query = parseQueryFromItem(item);
    if (query.length < 2) continue;
    const key = normalizeSearchKeyBase(query);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      query,
      resultCount: parseResultCount(item),
      lastSearchedAt: item.time || null,
    });
    if (out.length >= limit) break;
  }

  return out;
}

/** Trending: mix of user popularity + curated Pakistan defaults */
export function getTrendingSearchTags(limit = 6) {
  const stats = readStats();
  const fromUser = Object.entries(stats)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([query, count]) => ({
      label: capitalizeQuery(query),
      query,
      count,
      source: 'user',
    }));

  const merged = [];
  const used = new Set();

  for (const item of fromUser) {
    const key = item.query.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    merged.push(item);
    if (merged.length >= Math.min(3, limit)) break;
  }

  for (const item of CURATED_TRENDING) {
    if (merged.length >= limit) break;
    const key = item.query.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    merged.push({ ...item, source: 'curated' });
  }

  return merged.slice(0, limit);
}

export function clearRecentSearchQueries() {
  const kept = readHistoryRaw().filter((h) => h.type !== 'searched');
  writeHistoryRaw(kept);
}

export function formatRelativeSearchTime(isoOrLabel) {
  if (!isoOrLabel) return '';
  if (typeof isoOrLabel === 'string' && !isoOrLabel.includes('T')) {
    return isoOrLabel;
  }
  const date = new Date(isoOrLabel);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
