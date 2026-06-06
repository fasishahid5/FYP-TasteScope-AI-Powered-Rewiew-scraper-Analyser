# TasteScope Recent Searches - Quick Reference Cheat Sheet

## 🚀 Quick Start

### **To View Recent Searches**
```
1. Go to SearchDashboard → See 6 recent in grid
2. Go to CustomerDashboard → See 5 recent in header
3. Go to HistoryPage → See ALL searches with filters
```

### **To Test Search Logging**
```
1. Login to app
2. Search for "Biryani" (or any restaurant)
3. Check RecentSearches component → Should appear
4. Reload page → Should still be there
```

---

## 📊 Data Storage

### **Where Searches Are Stored**

| Storage Type | Location | Limit | Purpose |
|---|---|---|---|
| **Database** | MongoDB - User.searchHistory | 100 per user | Persistent storage |
| **Local** | Browser localStorage - ts_searchStats | 40 | Trending calculations |
| **Component** | React state - searches array | 6 (display) | UI rendering |

### **What's Stored Per Search**

```javascript
{
  _id: ObjectId,              // Auto-generated ID
  query: "biryani restaurant", // User's search term
  resultCount: 23,            // Number of results found
  searchedAt: Date,           // When search was performed
  firstResultDetails: {       // Details of top result
    name: "Al Baik",
    cuisine: "Pakistani",
    priceRange: "$$",
    rating: 4.8,
    location: "Lahore",
    sentiment: 92,
    reviews: 1245,
    image: "https://..."
  }
}
```

---

## 🎯 Key Components

### **Frontend Components**

| File | Purpose | Limit |
|------|---------|-------|
| `components/RecentSearches.jsx` | Displays searches | Configurable (default: 6) |
| `pages/SearchDashboard.jsx` | Main search page | Uses limit=6 |
| `pages/CustomerDashboard.jsx` | Home page | Uses limit=5 |
| `pages/HistoryPage.jsx` | Full history | No limit (all searches) |

### **Backend Routes**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/search/log` | Log a new search |
| GET | `/api/search/recent?limit=6` | Fetch recent searches |
| DELETE | `/api/search/:searchId` | Delete specific search |
| POST | `/api/search/clear` | Clear all searches |

---

## 🔄 Complete Data Flow (Simple)

```
1. User searches "Pizza"
   ↓
2. Frontend logs search:
   - Locally (for trending)
   - To database (POST /api/search/log)
   ↓
3. Backend receives request
   - Validates query (min 2 chars)
   - Adds to user.searchHistory
   - Saves to MongoDB
   ↓
4. Frontend fetches recent searches
   - GET /api/search/recent?limit=6
   - Deduplicates by query
   ↓
5. RecentSearches component renders grid
   - 6 cards max
   - Shows query, result count, time, first result
   ↓
6. User can:
   - Click card to re-search
   - Delete with ✕ button
   - Clear all from HistoryPage
```

---

## 🔐 Security

### **Protection Layers**
- ✅ JWT Authentication (token required)
- ✅ User Data Isolation (can't see others' searches)
- ✅ Input Validation (min 2 characters)
- ✅ MongoDB Injection Protection
- ✅ CORS Protection

### **What's Protected**
```
Without token:
  → GET /api/search/recent → Returns 401 Unauthorized

Without proper token:
  → Can't access other users' searches
  
With invalid query:
  → Single letter search → Rejected
  → Empty query → Rejected
```

---

## 🧪 Testing Checklist

### **Basic Tests**
- [ ] Perform search → Appears in RecentSearches
- [ ] Reload page → Search still there
- [ ] Delete search → Removed from UI
- [ ] Delete all → History cleared
- [ ] Time display → Shows relative time ("2h ago")

### **Database Tests**
```javascript
// Check MongoDB
db.users.findOne({email: "your@email.com"})
  .searchHistory.length  // Should be > 0

// Check API
GET /api/search/recent?limit=6
// Should return searches in JSON
```

### **Edge Cases**
- [ ] Search with < 2 characters → Should be rejected
- [ ] Search with special characters → Should work
- [ ] 101st search → 1st should be removed (keep 100 max)
- [ ] Same search twice → Both stored, only 1 in "recent"

---

## ⚙️ Configuration

### **Adjustable Limits**

**To change number of recent searches shown:**

```javascript
// SearchDashboard.jsx - Line 123
<RecentSearches limit={6} />  // Change 6 to any number

// CustomerDashboard.jsx - Line 542
<RecentSearches limit={5} />  // Change 5 to any number
```

**To change max stored searches:**

```javascript
// backend/controllers/searchController.js - Line 262
user.searchHistory = user.searchHistory.slice(0, 100)  // Change 100
```

---

## 🐛 Quick Troubleshooting

### **Searches Not Appearing?**
1. Check user is logged in: `getStoredUser()` has token
2. Check backend logs for errors
3. Open Network tab → Verify API calls successful
4. Check MongoDB has data: `db.users.findOne()...`

### **Delete Not Working?**
1. Check searchId is valid
2. Check DELETE request in Network tab
3. Check MongoDB for data (should be deleted)
4. Check UI state updates

### **Time Not Showing Correctly?**
1. Check formatRelativeTime function working
2. Check searchedAt timestamp is set
3. Check time zone settings

---

## 📱 Display Details

### **Grid Layout**
```
Auto-fill: Creates responsive columns
Min size: 240px per card
Gap: 16px between cards
Result: 3-4 cards on desktop, 1-2 on mobile
```

### **Card Content**
```
┌─────────────────────┐
│ ✕ (top right)       │
│ 🔍 Query Text       │
│ 📊 X results        │
│ [First Result Preview]
│ ─────────────────   │
│ Time (e.g., 2h ago) │
└─────────────────────┘
```

### **Colors**
- Card: White (#fff)
- Border: Light gray (#e2e8f0)
- Text: Dark (#0f172a)
- Icon: Blue (#2563eb)
- Delete hover: Gray (#94a3b8)

---

## 🎯 Common Tasks

### **Task: Show 10 Recent Searches Instead of 6**
```javascript
// Change in SearchDashboard.jsx
<RecentSearches limit={10} />
```

### **Task: Allow 1-character Searches**
```javascript
// Change in searchController.js
if (!query || String(query).trim().length < 1) {  // Change < 2 to < 1
  return res.status(400).json({ msg: 'Query required' });
}
```

### **Task: Store 200 Searches Instead of 100**
```javascript
// Change in searchController.js
user.searchHistory = user.searchHistory.slice(0, 200)  // Change 100 to 200
```

### **Task: Clear Searches Older Than 7 Days**
```javascript
// Add in searchController.js after fetchUser
const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
user.searchHistory = user.searchHistory.filter(s => 
  new Date(s.searchedAt) > sevenDaysAgo
);
```

---

## 📚 Key Files to Know

| File | Purpose | Key Lines |
|------|---------|-----------|
| `components/RecentSearches.jsx` | Display component | 3 (limit), 14 (fetch) |
| `lib/searchHistoryService.js` | API calls | logSearchToDatabase, fetchRecentSearches |
| `lib/searchInsights.js` | Local tracking | logSearchQuery |
| `backend/routes/search.js` | Routes | All 4 endpoints defined |
| `backend/controllers/searchController.js` | Logic | logSearch, getRecentSearches |
| `backend/models/User.js` | DB schema | searchHistory field |

---

## 🔗 Links

**Documentation**:
- Full analysis: [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)
- Testing guide: [DATA_STORAGE_GUIDE.md](DATA_STORAGE_GUIDE.md)
- Integration: [RECENT_SEARCHES_INTEGRATION_GUIDE.md](RECENT_SEARCHES_INTEGRATION_GUIDE.md)
- Summary: [ANALYSIS_SUMMARY.md](ANALYSIS_SUMMARY.md)

**Code**:
- Frontend: `components/RecentSearches.jsx`, `lib/searchHistoryService.js`
- Backend: `backend/controllers/searchController.js`, `backend/routes/search.js`
- Database: `backend/models/User.js`

---

## ✅ Status Overview

```
✅ Backend API: Working
✅ Database Storage: Working
✅ Frontend Display: Working
✅ Data Persistence: Working
✅ Security: Implemented
✅ UI/UX: Professional
✅ Documentation: Complete

🎉 EVERYTHING IS READY TO USE!
```

---

## 🚀 One-Line Summary

**Recent Searches** logs searches to MongoDB, displays 5-6 professionally in SearchDashboard/CustomerDashboard, shows all in HistoryPage, and persists across sessions with proper security and great UX.

---

**Last Updated**: June 5, 2026  
**Difficulty Level**: Easy to Use, Well Documented  
**Status**: Production Ready ✨
