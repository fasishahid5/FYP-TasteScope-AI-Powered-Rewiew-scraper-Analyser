# Search History Feature - Implementation Guide

## Overview
Users' search queries are now automatically stored in MongoDB and displayed as recent searches when they open the application. The system maintains a history of searches with result counts and first restaurant details.

## Backend Implementation

### Database Schema Update
**File:** `backend/models/User.js`

Added `searchHistory` array to User model:
```javascript
searchHistory: {
  type: [{
    query: String,
    resultCount: Number,
    searchedAt: Date,
    firstResultDetails: {
      name: String,
      cuisine: String,
      priceRange: String,
      rating: Number,
      location: String,
      sentiment: Number,
      reviews: Number,
      image: String
    }
  }],
  default: []
}
```

### API Endpoints
**File:** `backend/controllers/searchController.js` & `backend/routes/search.js`

Four new endpoints have been created:

1. **Log Search** - `POST /api/search/log`
   - Logs a search query to user's database
   - Parameters: `query`, `resultCount`, `firstResultDetails`
   - Keeps last 100 searches per user
   - Removes duplicates by query

2. **Get Recent Searches** - `GET /api/search/recent?limit=6`
   - Fetches unique recent searches for the user
   - Default limit: 6, max: 20
   - Returns deduped searches ordered by most recent

3. **Clear History** - `POST /api/search/clear`
   - Clears all search history for the user

4. **Delete Search** - `DELETE /api/search/:searchId`
   - Removes a specific search from history

All endpoints require authentication via JWT token.

## Frontend Implementation

### Service Layer
**File:** `lib/searchHistoryService.js`

Provides functions to interact with the backend:
- `logSearchToDatabase()` - Log a search
- `fetchRecentSearches()` - Fetch recent searches
- `clearAllSearchHistory()` - Clear history
- `deleteSearchFromHistory()` - Delete a specific search
- `formatRelativeTime()` - Format timestamps (e.g., "2h ago")

### UI Component
**File:** `components/RecentSearches.jsx`

Professional recent searches display component featuring:
- Grid layout (responsive)
- Search icon with emoji indicator (🔍)
- Query text
- Result count display
- First restaurant preview (if available)
- Relative time display
- Delete button for individual searches
- Hover effects and smooth transitions
- Loading state
- Empty state message

### Integration

**SearchDashboard** (`pages/SearchDashboard.jsx`)
- Imports and uses `logSearchToDatabase()`
- Calls it when search is performed
- Displays RecentSearches component
- Passes search query to handler for re-searching

**CustomerDashboard** (`pages/CustomerDashboard.jsx`)
- Shows RecentSearches component in header
- Displays 5 most recent searches
- Users can click to re-search

## How It Works

### User Flow:
1. User performs a search (e.g., "Biryani near me")
2. Search is logged to localStorage (existing) AND to database (new)
3. Backend saves search with:
   - Query string
   - Result count
   - First restaurant's details (cuisine, price, rating, etc.)
4. User opens app again or navigates to dashboard
5. Recent searches are fetched from database and displayed
6. User can click a recent search to re-perform it
7. User can delete individual searches or clear all

## Data Retention

- **Per User:** Each user has their own search history
- **Limit:** Last 100 searches per user (stored on database)
- **Deduplication:** Multiple identical searches are merged (only latest shown)
- **Display:** Shows 5-6 most recent unique searches in UI

## Features

✅ Persistent across sessions/devices  
✅ Automatic logging on every search  
✅ First result preview  
✅ Result count display  
✅ Time-based sorting  
✅ Individual search deletion  
✅ Clear all history option  
✅ Professional UI/UX  
✅ Responsive grid layout  
✅ Smooth animations and transitions

## Testing the Feature

1. Make sure backend is running: `npm run dev` in backend folder
2. Log in as a user
3. Perform several searches (e.g., "Biryani", "Pizza", "Karahi")
4. Recent searches will appear in:
   - CustomerDashboard header (5 searches)
   - SearchDashboard header (6 searches)
5. Click a recent search to re-search
6. Refresh the page - searches persist
7. Delete a search by clicking the × button
8. Search history is stored per user in MongoDB

## Database Structure

Each search history entry in MongoDB contains:
```json
{
  "_id": "ObjectId",
  "query": "biryani",
  "resultCount": 12,
  "searchedAt": "2024-01-15T10:30:00Z",
  "firstResultDetails": {
    "name": "Biryani House",
    "cuisine": "Pakistani",
    "priceRange": "$$",
    "rating": 4.5,
    "location": "Lahore, Pakistan",
    "sentiment": 85,
    "reviews": 245,
    "image": "https://..."
  }
}
```

## Browser Compatibility

- Works with all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires browser to support:
  - ES6+ JavaScript
  - Fetch API
  - LocalStorage (for fallback)
