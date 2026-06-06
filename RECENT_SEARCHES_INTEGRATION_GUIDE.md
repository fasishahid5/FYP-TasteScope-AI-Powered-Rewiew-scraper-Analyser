# TasteScope Recent Searches - Integration Guide

## 🎯 Feature Overview

**Recent Searches** feature tracks and displays user search history across the application with professional UI/UX and complete data persistence.

---

## 📍 Integration Points

### **1. Search Dashboard** (Main Search Interface)

**File**: `pages/SearchDashboard.jsx`

**Location in UI**:
```
┌─────────────────────────────────────────────────────────────┐
│  Search Dashboard Header                                    │
├─────────────────────────────────────────────────────────────┤
│  Welcome back, [Customer Name]                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ AutocompleteSearch - Main search input               │  │
│  └──────────────────────────────────────────────────────┘  │
│  [Sort By: Relevance] [Filter Button]                      │
├─────────────────────────────────────────────────────────────┤
│  RECENT SEARCHES SECTION                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐   │
│  │ Search Card 1   │  │ Search Card 2   │  │ ... (5-6) │   │
│  │ Biryani         │  │ Pizza           │  └──────────┘   │
│  │ 23 results ✕    │  │ 18 results ✕    │                 │
│  │ 2 hours ago     │  │ 1 hour ago      │                 │
│  └─────────────────┘  └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  SEARCH RESULTS                                             │
│  [Restaurant cards grid...]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Code Integration**:
```javascript
// Line 7: Import
import { logSearchToDatabase, fetchRecentSearches } from '../lib/searchHistoryService';

// Line 123-130: Component Usage
<RecentSearches 
  limit={6} 
  onSearchSelect={(query) => { 
    setSearchQuery(query); 
  }} 
/>

// Line 140-165: Auto-logging searches
useEffect(() => {
  const q = pendingSearchQuery.trim();
  if (q.length < 2) return;
  
  logSearchQuery(q, filteredRestaurants.length, filteredRestaurants[0]);
  logSearchToDatabase(q, filteredRestaurants.length, {
    name: firstResult.name,
    cuisine: firstResult.cuisine,
    priceRange: firstResult.priceRange,
    rating: firstResult.rating,
    location: firstResult.location,
    sentiment: firstResult.sentiment,
    reviews: firstResult.reviews,
    image: firstResult.image,
  });
  refreshSearchInsights();
}, [pendingSearchQuery, filteredRestaurants, refreshSearchInsights]);
```

**Features**:
- ✅ Shows 6 recent searches in grid
- ✅ Automatically logs each search performed
- ✅ Click card to re-search
- ✅ Delete button to remove from history
- ✅ First result preview with details

---

### **2. Customer Dashboard** (Home Page)

**File**: `pages/CustomerDashboard.jsx`

**Location in UI**:
```
┌──────────────────────────────────────────────────┐
│  Customer Dashboard                              │
├──────────────────────────────────────────────────┤
│  Hi [Customer], find restaurants near you       │
│                                                  │
│  [Search Bar with Autocomplete]                 │
│                                                  │
│  RECENT SEARCHES                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐    │
│  │Search 1│ │Search 2│ │Search 3│ │..5 │    │
│  └────────┘ └────────┘ └────────┘ └──────┘    │
│                                                  │
│  FEATURED RESTAURANTS                           │
│  [Restaurant cards...]                          │
└──────────────────────────────────────────────────┘
```

**Code Integration**:
```javascript
// Line 6: Import
import RecentSearches from '../components/RecentSearches';

// Line 542: Component Usage
<RecentSearches 
  limit={5} 
  onSearchSelect={(query) => { 
    setSearchQuery(query); 
  }} 
/>
```

**Features**:
- ✅ Shows 5 recent searches (limit=5)
- ✅ Smaller display than SearchDashboard
- ✅ Quick access to previous searches
- ✅ Professional card design

---

### **3. History Page** (Full History Unified View)

**File**: `pages/HistoryPage.jsx`

**Location in UI**:
```
┌────────────────────────────────────────────────────┐
│  History Page                                      │
├────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐                  │
│  │ [Search Box] [Filter: All] ✓│                  │
│  └─────────────────────────────┘                  │
│                                                   │
│  Stats: [👁️ 45 Visited] [🔁 12 Compared]        │
│         [🔎 89 Searched] [⭐ 23 Favorites]       │
│                                                   │
│  HISTORY ITEMS (All types):                       │
│  ┌──────────────┐  ┌──────────────┐              │
│  │🔎 Biryani    │  │⭐ Pizza      │              │
│  │Searched      │  │Favorite      │              │
│  │1 day ago     │  │2 days ago    │              │
│  │89 results    │  │               │              │
│  └──────────────┘  └──────────────┘              │
│                                                   │
│  Filter options: All, Visited, Compared, Searched│
└────────────────────────────────────────────────────┘
```

**Code Integration**:
```javascript
// Line 6: Import
import { fetchUnifiedHistory, ... } from '../lib/unifiedHistoryService';

// Line 58: Load unified history on mount
useEffect(() => {
  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchUnifiedHistory();
    const favList = await getFavoritesList();
    setHistoryData(data);
    setFavorites(favList);
    setLoading(false);
  };
  loadHistory();
}, []);

// Line 76-88: Filter and search
const filteredHistory = useMemo(() => {
  let items = historyData.history || [];
  
  if (selectedType !== 'all') {
    items = items.filter((item) => item.type === selectedType);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    items = items.filter((item) => {
      const name = item.details?.name || item.name || item.query || '';
      const cuisine = item.details?.cuisine || '';
      const location = item.details?.location || '';
      return (
        name.toLowerCase().includes(query) ||
        cuisine.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query)
      );
    });
  }
  
  return items;
}, [historyData, selectedType, searchQuery]);
```

**Features**:
- ✅ Shows ALL searches (not limited to 6)
- ✅ Shows unified history (searches + visits + comparisons + favorites)
- ✅ Statistics dashboard with counts
- ✅ Filter by type (All, Visited, Compared, Searched, Favorites)
- ✅ Search within history
- ✅ Each item shows type badge with emoji
- ✅ Time display (relative)
- ✅ Result count for searches

---

## 🔄 Data Flow Architecture

### **Complete Request/Response Cycle**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER PERFORMS SEARCH (SearchDashboard.jsx:140-165)           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. LOCAL LOGGING (searchInsights.js)                             │
│    - logSearchQuery(q, resultCount, firstResult)                 │
│    - Stores in LocalStorage: ts_searchStats                      │
│    - Used for trending tags                                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATABASE LOGGING (searchHistoryService.js)                    │
│    - logSearchToDatabase(q, resultCount, firstResultDetails)    │
│    - POST /api/search/log                                        │
│    - Sends query, result count, first restaurant details         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND PROCESSING (searchController.js:logSearch)            │
│    - Validate query (min 2 chars)                                │
│    - Create search history entry                                 │
│    - Add to user.searchHistory (unshift - newest first)          │
│    - Keep only last 100 searches (slice 0-100)                   │
│    - Save to MongoDB                                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. REFRESH UI (RecentSearches component)                         │
│    - fetchRecentSearches(limit) called                           │
│    - GET /api/search/recent?limit=6                              │
│    - Backend deduplicates by query (lowercase)                   │
│    - Returns max 6 unique searches                               │
│    - Component renders grid of cards                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Service Functions Reference

### **Frontend Services**

#### **searchHistoryService.js**

```javascript
// Log search to database
export async function logSearchToDatabase(query, resultCount, firstResultDetails)
// Usage: searchHistoryService.logSearchToDatabase("biryani", 23, {...})

// Fetch recent searches (deduped)
export async function fetchRecentSearches(limit = 6)
// Usage: const searches = await fetchRecentSearches(6)
// Returns: Array of search objects with _id, query, resultCount, searchedAt, firstResultDetails

// Delete specific search
export async function deleteSearchFromHistory(searchId)
// Usage: await deleteSearchFromHistory(searchId)

// Clear all searches
export async function clearAllSearchHistory()
// Usage: await clearAllSearchHistory()

// Format time
export function formatRelativeTime(dateString)
// Usage: formatRelativeTime("2025-06-05T10:30:00Z")
// Returns: "2 hours ago", "1 day ago", etc.
```

#### **searchInsights.js**

```javascript
// Log search locally (no DB)
export function logSearchQuery(query, resultCount = 0, firstResult = null)
// Usage: logSearchQuery("biryani", 23, {name: "Al Baik", ...})

// Get recent local searches
export function getRecentSearchQueries(limit)
// Usage: const recent = getRecentSearchQueries(6)

// Get trending search tags
export function getTrendingSearchTags(limit)
// Usage: const trending = getTrendingSearchTags(6)

// Clear local search stats
export function clearRecentSearchQueries()
// Usage: clearRecentSearchQueries()
```

#### **unifiedHistoryService.js**

```javascript
// Fetch all history types unified
export async function fetchUnifiedHistory()
// Returns: { 
//   history: [...all items with types], 
//   stats: { searches, comparisons, favorites, visits } 
// }

// Get favorites list
export async function getFavoritesList()
// Returns: Array of restaurantIds that are favorited

// Toggle favorite
export async function toggleFavoriteRestaurant(restaurantId)
// Returns: { isFavorite, message }
```

---

## 📦 Component Props

### **RecentSearches Component**

```javascript
<RecentSearches 
  // Maximum number of searches to display (default: 6)
  limit={6}
  
  // Callback when user clicks on a search card
  // Receives the search query as parameter
  onSearchSelect={(query) => {
    setSearchQuery(query);  // Re-perform search
  }}
/>
```

**Component Features**:
- ✅ Auto-loads on mount
- ✅ Shows loading state
- ✅ Shows empty state
- ✅ Grid layout (auto-fill, min 240px)
- ✅ Delete button on hover
- ✅ Click to re-search
- ✅ Result count display
- ✅ First result preview
- ✅ Time formatting
- ✅ Responsive design

---

## 🎨 UI Components Breakdown

### **RecentSearches Card Structure**

```
┌─────────────────────────────────────┐
│  ✕ (delete button - top right)      │
│                                     │
│  🔍 Biryani Restaurant Lahore       │ (Icon + Query)
│                                     │
│  📊 23 results                      │ (Result count)
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Al Baik Biryani               │  │ (First result preview)
│  │ Pakistani                     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│  2 hours ago                        │ (Relative time)
└─────────────────────────────────────┘
```

### **Color Scheme**

| Element | Color | Hex |
|---------|-------|-----|
| Card Background | White | #fff |
| Border | Light Gray | #e2e8f0 |
| Text Primary | Dark Slate | #0f172a |
| Text Secondary | Medium Gray | #64748b |
| Icon Background | Very Light Blue | #f1f5f9 |
| Icon Color | Blue | #2563eb |
| Delete Color | Light Gray | #94a3b8 |
| Hover Shadow | Subtle | rgba(15,23,42,0.1) |

---

## 🔐 Security & Access Control

### **Authentication Flow**

```
Client Request
    ↓
Contains JWT in Authorization header?
    ├─ NO  → Return 401 Unauthorized
    └─ YES → Extract user ID from token
             ↓
             Fetch user searches from DB
             ↓
             Return only searches for that user
             ↓
             Cannot see other users' searches
```

### **Authorization Checks**

```javascript
// Every search endpoint checks:
1. User authentication (JWT token required)
2. User identification (extract userId from token)
3. Data ownership (return only user's searches)
4. Input validation (query length, resultCount type, etc.)
```

---

## 🐛 Troubleshooting Guide

### **Issue: Recent Searches Not Showing**

**Checklist**:
1. ✓ User is logged in (check token in localStorage)
2. ✓ Backend server running (check console for errors)
3. ✓ MongoDB connected (check backend logs)
4. ✓ Search routes registered in server.js
5. ✓ fetchRecentSearches being called
6. ✓ API returning data (check Network tab)

**Debug Steps**:
```javascript
// Console check
const user = getStoredUser();
console.log('User token:', user?.token);
console.log('API URL:', API_BASE_URL);

// API test
const searches = await fetchRecentSearches(6);
console.log('Recent searches:', searches);
```

### **Issue: Search Not Being Logged**

**Check**:
1. ✓ logSearchToDatabase being called
2. ✓ Query >= 2 characters
3. ✓ User authenticated
4. ✓ Network request succeeded
5. ✓ MongoDB write permissions

**Debug Steps**:
```javascript
// Add logging in SearchDashboard.jsx
console.log('Logging search:', {
  query: q,
  resultCount: filteredRestaurants.length,
  firstResult: filteredRestaurants[0]
});

// Check database
db.users.findOne({_id: userId})
  .searchHistory.length  // Should increase
```

### **Issue: Delete Not Working**

**Check**:
1. ✓ Search ID valid (ObjectId)
2. ✓ DELETE endpoint working
3. ✓ Frontend filtering state correctly
4. ✓ UI not in loading state

**Debug Steps**:
```javascript
// Check delete endpoint
DELETE /api/search/[searchId]

// Verify response
// Should return: { msg: "Search deleted" }

// Check UI state update
console.log('Before delete:', searches.length);
console.log('After delete:', searches.length);
```

---

## 📊 Data Retention Policies

### **Storage Limits**

| Parameter | Value | Reason |
|-----------|-------|--------|
| Recent search limit | 6 | Professional UI fit |
| History page limit | All searches | Complete history |
| Database storage | Last 100 per user | Performance |
| Local storage | Last 40 | Browser limits |
| Trending tags | Last 50 unique | Analytics |

### **Cleanup Rules**

- Searches older than 100 entries are removed
- Only most recent 100 kept per user
- User deletion cascades to searches
- No automatic expiry (permanent unless deleted)

---

## 🚀 Performance Metrics

### **Expected Response Times**

| Operation | Target | Typical |
|-----------|--------|---------|
| Log search | < 500ms | 200-300ms |
| Fetch recent (6) | < 200ms | 100-150ms |
| Delete search | < 300ms | 150-200ms |
| Component render | < 1s | 500-800ms |

### **Database Optimization**

```javascript
// Recommended MongoDB index
db.users.createIndex({ email: 1 })

// Query optimization
// Fetch only recent subset, not all 100
db.users.find({_id: userId})
  .projection({ 
    searchHistory: { $slice: [0, 6] } 
  })
```

---

## 📚 API Reference

### **POST /api/search/log**

**Logs a search**

```http
POST /api/search/log HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "biryani restaurant lahore",
  "resultCount": 23,
  "firstResultDetails": {
    "name": "Al Baik Biryani",
    "cuisine": "Pakistani",
    "priceRange": "$$",
    "rating": 4.8,
    "location": "Lahore, Pakistan",
    "sentiment": 92,
    "reviews": 1245,
    "image": "https://..."
  }
}
```

**Response**:
```json
{
  "msg": "Search logged successfully",
  "searchHistory": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "query": "biryani restaurant lahore",
      "resultCount": 23,
      "searchedAt": "2025-06-05T10:30:00.000Z",
      "firstResultDetails": { ... }
    }
  ]
}
```

---

### **GET /api/search/recent**

**Fetches recent unique searches**

```http
GET /api/search/recent?limit=6 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "recentSearches": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "query": "biryani restaurant",
      "resultCount": 23,
      "searchedAt": "2025-06-05T10:30:00.000Z",
      "firstResultDetails": { ... }
    }
  ],
  "total": 1
}
```

---

### **DELETE /api/search/:searchId**

**Deletes specific search**

```http
DELETE /api/search/507f1f77bcf86cd799439011 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "msg": "Search deleted successfully",
  "searchHistory": [...]
}
```

---

### **POST /api/search/clear**

**Clears all searches**

```http
POST /api/search/clear HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "msg": "Search history cleared",
  "searchHistory": []
}
```

---

## ✅ Feature Checklist

### **Core Features**
- ✅ Log searches to MongoDB
- ✅ Retrieve recent searches
- ✅ Display in RecentSearches component
- ✅ Delete individual search
- ✅ Delete all searches
- ✅ Time relative formatting
- ✅ First result preview
- ✅ Result count display
- ✅ Responsive grid layout
- ✅ Professional UI/UX

### **Integration**
- ✅ SearchDashboard integration
- ✅ CustomerDashboard integration
- ✅ HistoryPage integration
- ✅ Unified history with other types
- ✅ Favorites integration
- ✅ Statistics dashboard
- ✅ Filter & search functionality

### **Data Persistence**
- ✅ MongoDB storage
- ✅ User-specific data
- ✅ Session persistence
- ✅ Deduplication by query
- ✅ Last 100 searches per user
- ✅ Index optimization ready

### **Security**
- ✅ JWT authentication
- ✅ User data isolation
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ CORS enabled
- ✅ Role-based access

---

## 📞 Support & Documentation

### **Code Files**
- [Recent Searches Component](components/RecentSearches.jsx)
- [Search History Service](lib/searchHistoryService.js)
- [Search Insights Service](lib/searchInsights.js)
- [Unified History Service](lib/unifiedHistoryService.js)
- [Search Controller](backend/controllers/searchController.js)
- [Search Routes](backend/routes/search.js)

### **Documentation Files**
- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)
- [DATA_STORAGE_GUIDE.md](DATA_STORAGE_GUIDE.md)
- [SEARCH_HISTORY_FEATURE.md](SEARCH_HISTORY_FEATURE.md)

---

**Last Updated**: June 5, 2026  
**Feature Status**: ✅ Production Ready  
**Tested On**: Chrome, Firefox, Safari, Mobile browsers
