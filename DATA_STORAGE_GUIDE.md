# Data Storage & Testing Guide for Recent Searches

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER PERFORMS SEARCH IN SEARCH DASHBOARD                  │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │  AutocompleteSearch Component         │
         │  - User types: "biryani restaurant"   │
         │  - searchQuery state updated          │
         │  - Google Places API called           │
         └────────────┬────────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │  handleSearchCommit(query) called        │
    │  - setPendingSearchQuery(query)          │
    │  - Triggers search effect                │
    └────────────┬────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────────────────┐
    │  useEffect([pendingSearchQuery]) - Lines 140-165           │
    │                                                             │
    │  1. Log Locally (localStorage):                            │
    │     logSearchQuery(q, resultCount, firstResult)            │
    │     └─> Stores in 'ts_searchStats' + 'ts_history'          │
    │                                                             │
    │  2. Log to Database (MongoDB):                             │
    │     logSearchToDatabase(q, resultCount, firstResultDetails)│
    │     └─> HTTP POST to /api/search/log                       │
    └────────────┬─────────────────────────────────────────────┘
                 │
         ┌───────┴───────────────────────────────────┐
         │                                           │
         ▼                                           ▼
    ┌─────────────────────┐            ┌────────────────────────────┐
    │  LOCAL STORAGE      │            │  BACKEND API REQUEST       │
    ├─────────────────────┤            ├────────────────────────────┤
    │ ts_searchStats:     │            │ POST /api/search/log       │
    │ {                   │            │                            │
    │   "biryani...": {    │            │ Headers:                   │
    │     count: 5,       │            │ Authorization: Bearer JWT  │
    │     lastSearch: ...  │            │                            │
    │   }                 │            │ Body: {                    │
    │ }                   │            │   query: "biryani...",     │
    │                     │            │   resultCount: 23,         │
    │ ts_history:         │            │   firstResultDetails: {...}│
    │ [...]               │            │ }                          │
    │                     │            └────────────┬──────────────┘
    │ ts_restaurantPool:  │                         │
    │ [results...]        │                         ▼
    └─────────────────────┘            ┌────────────────────────────┐
                                       │  MIDDLEWARE: auth.js       │
                                       │  - Verify JWT token        │
                                       │  - Extract user ID         │
                                       │  - Attach to req.user      │
                                       └────────────┬──────────────┘
                                                    │
                                                    ▼
                                       ┌────────────────────────────┐
                                       │  CONTROLLER: logSearch()   │
                                       │  - Validate query (2+ chars)│
                                       │  - Create search object    │
                                       │  - Add to user.searchHistory│
                                       │  - Keep last 100 searches  │
                                       │  - user.save()             │
                                       └────────────┬──────────────┘
                                                    │
                                                    ▼
                                       ┌────────────────────────────┐
                                       │  MONGODB: User Collection  │
                                       │                            │
                                       │  user: {                   │
                                       │    _id: ObjectId(...),     │
                                       │    email: "user@email",    │
                                       │    searchHistory: [        │
                                       │      {                     │
                                       │        _id: ObjectId,      │
                                       │        query: "biryani",   │
                                       │        resultCount: 23,    │
                                       │        searchedAt: Date,   │
                                       │        firstResultDetails{}│
                                       │      },                    │
                                       │      ...                   │
                                       │    ]                       │
                                       │  }                         │
                                       └────────────┬──────────────┘
                                                    │
                                                    ▼
                                       ┌────────────────────────────┐
                                       │  RESPONSE TO FRONTEND      │
                                       │  {                         │
                                       │    msg: "Logged success",  │
                                       │    searchHistory: [...]    │
                                       │  }                         │
                                       └────────────────────────────┘

                                                    │
         ┌──────────────────────────────────────────┴──────────┐
         │                                                     │
         ▼                                                     ▼
    ┌─────────────────────────────┐        ┌──────────────────────────┐
    │  REFRESH INSIGHTS            │        │  COMPONENT UPDATES       │
    │  refreshSearchInsights()      │        │  - setPendingSearchQuery: ''│
    │  - Reload trending tags      │        │  - Clears pending state  │
    │  - Reload recent searches    │        └──────────────────────────┘
    └─────────────────────────────┘
```

---

## 🔍 Database Verification Steps

### **Step 1: Check MongoDB Connection**

**Command to verify**:
```bash
# From backend directory
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tastescope')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ Connection failed:', err.message));
"
```

### **Step 2: Verify User Model Has searchHistory**

**MongoDB Query** (using Compass or MongoDB CLI):
```javascript
db.users.findOne({ email: "test@example.com" })
```

**Expected Output** should include:
```javascript
{
  _id: ObjectId(...),
  email: "test@example.com",
  name: "Test User",
  searchHistory: [
    {
      _id: ObjectId(...),
      query: "biryani restaurant",
      resultCount: 23,
      searchedAt: ISODate("2025-06-05T10:30:00Z"),
      firstResultDetails: {
        name: "Al Baik Biryani",
        cuisine: "Pakistani",
        priceRange: "$$",
        rating: 4.8,
        location: "Lahore, Pakistan",
        sentiment: 92,
        reviews: 1245,
        image: "https://..."
      }
    },
    // ... more searches
  ]
}
```

### **Step 3: Test API Endpoint Directly**

**Using cURL or Postman**:

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Response: { token: "eyJ0eX..." }

# 2. Log a search
curl -X POST http://localhost:5000/api/search/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eX..." \
  -d '{
    "query": "biryani restaurant lahore",
    "resultCount": 23,
    "firstResultDetails": {
      "name": "Al Baik Biryani",
      "cuisine": "Pakistani",
      "rating": 4.8
    }
  }'

# Response: 
# {
#   "msg": "Search logged successfully",
#   "searchHistory": [...]
# }

# 3. Get recent searches
curl -X GET "http://localhost:5000/api/search/recent?limit=6" \
  -H "Authorization: Bearer eyJ0eX..."

# Response:
# {
#   "recentSearches": [
#     {
#       "_id": "507f1f77bcf86cd799439011",
#       "query": "biryani restaurant lahore",
#       "resultCount": 23,
#       "searchedAt": "2025-06-05T10:30:00Z",
#       "firstResultDetails": {...}
#     }
#   ],
#   "total": 1
# }
```

---

## 📋 Data Storage Checklist

### **Backend Storage ✅**
- ✅ Searches logged to MongoDB
- ✅ Each search has unique ObjectId
- ✅ Query stored as-is (not modified)
- ✅ Result count tracked
- ✅ First result details captured
- ✅ Search timestamp recorded
- ✅ Last 100 searches kept per user
- ✅ Older searches automatically pruned

### **Data Duplication Check**
- ✅ Same query logged multiple times = separate entries
- ✅ Deduplication happens on retrieval (getRecentSearches)
- ✅ Only unique queries shown in "recent" list
- ✅ Full history with duplicates stored in database

### **Database Constraints**
- ✅ User-specific searches (no data leak)
- ✅ JWT authentication required
- ✅ No direct collection access
- ✅ Only authorized users can see own searches

---

## 🧪 Testing Scenarios

### **Scenario 1: New User First Search**

1. User logs in
2. Goes to SearchDashboard
3. Searches for "biryani restaurant"
4. Google API returns 23 results
5. System logs search to database

**Verification**:
```javascript
// Check MongoDB
db.users.findOne({ email: "test@example.com" })
  .searchHistory.length // Should be >= 1

// Check RecentSearches component
// Should show 1 card with "biryani restaurant"
```

---

### **Scenario 2: Multiple Searches**

1. User searches: "Pizza restaurant"
2. User searches: "Chinese food"
3. User searches: "Café near me"
4. User searches: "Pizza restaurant" (repeat)

**Expected Behavior**:
- Database: 4 entries total (with duplicate)
- RecentSearches Component: Shows 4 unique queries (or 3 if dedup on retrieval)
- All with result counts and timestamps

**Verification**:
```javascript
// Recent searches should show deduplicated list
db.users.findOne({ _id: userId })
  .searchHistory
  .slice(0, 6)  // Get top 6
```

---

### **Scenario 3: Delete Search**

1. User has 5 searches
2. User clicks delete on 1 search
3. Component calls `deleteSearchFromHistory(searchId)`

**Expected Behavior**:
- API: DELETE /api/search/:searchId
- Database: Removes specific search entry
- Frontend: Removes card from UI
- Result: 4 searches remain

**Verification**:
```javascript
// Before delete
db.users.findOne({ _id: userId }).searchHistory.length // 5

// After delete (from API response)
db.users.findOne({ _id: userId }).searchHistory.length // 4
```

---

### **Scenario 4: Clear All History**

1. User has 10 searches
2. User clicks "Clear All" button
3. API: POST /api/search/clear

**Expected Behavior**:
- All searches deleted
- searchHistory array becomes empty `[]`
- UI shows "No recent searches"

**Verification**:
```javascript
db.users.findOne({ _id: userId }).searchHistory // []
```

---

### **Scenario 5: Session Persistence**

1. User logs in and searches "Biryani"
2. Search is logged to database
3. User closes browser
4. User comes back next day and logs in
5. Goes to Dashboard → Recent Searches

**Expected Behavior**:
- RecentSearches component fetches from API
- API queries database
- "Biryani" search still appears
- Shows timestamp: "1 day ago"

**Verification**:
```javascript
// Frontend
const recentSearches = await fetchRecentSearches(6);
// Should return searches from days ago
```

---

### **Scenario 6: Data Not in Database**

**Tests to verify no data loss**:

✅ Searches without token → Rejected (not logged)
✅ Anonymous user searches → Not logged
✅ Invalid query (< 2 chars) → Rejected
✅ Network error during log → Not saved
✅ User deleted → Searches also deleted (cascade?)

---

## 🔐 Security Verification

### **Test: Unauthorized Access**

```bash
# Without token
curl -X GET http://localhost:5000/api/search/recent

# Response should be:
# { "msg": "Unauthorized" } + 401 status
```

### **Test: User Data Isolation**

```bash
# User A token to get User B's searches
# Should return empty or error, not User B's data
```

### **Test: SQL Injection Prevention**

```bash
# Query with SQL injection attempt
curl -X POST http://localhost:5000/api/search/log \
  -H "Authorization: Bearer <token>" \
  -d '{"query":"biryani; DROP TABLE users;--"}'

# Should store as literal string, not execute
```

---

## 📱 Frontend Verification

### **RecentSearches Component Tests**

```javascript
// Test 1: Load with searches
<RecentSearches limit={6} />
// Expected: Grid with up to 6 cards

// Test 2: Load with no searches
<RecentSearches limit={6} />
// Expected: "No recent searches yet" message

// Test 3: Load with many searches
<RecentSearches limit={6} />
// Expected: Shows max 6 (respects limit)

// Test 4: Click search card
onClick={(query) => setSearchQuery(query)}
// Expected: Triggers new search with that query

// Test 5: Delete button click
onClick={() => deleteSearchFromHistory(searchId)}
// Expected: Card removed, API called
```

---

## 🐛 Debugging Checklist

### **If Searches Not Appearing:**

1. Check API authentication
   ```bash
   # Verify token is sent
   Authorization: Bearer <jwt_token>
   ```

2. Check database connection
   ```javascript
   // In server.js console
   // Should see: "MongoDB connected"
   ```

3. Check user exists in DB
   ```javascript
   db.users.count({ email: "user@email.com" })
   // Should be >= 1
   ```

4. Check searchHistory field
   ```javascript
   db.users.findOne({ email: "user@email.com" })
   // Should have searchHistory array
   ```

5. Check middleware
   ```javascript
   // server.js line 37
   app.use('/api/search', require('./routes/search'));
   // Must be registered
   ```

### **If RecentSearches Component Not Loading:**

1. Check import
   ```javascript
   // SearchDashboard.jsx
   import RecentSearches from '../components/RecentSearches';
   // Must exist
   ```

2. Check API endpoint
   ```javascript
   // searchHistoryService.js
   const response = await fetch(`${API_URL}/recent?limit=${limit}`);
   // Must be correct URL
   ```

3. Check auth service
   ```javascript
   const user = getStoredUser();
   // Must return user with token
   ```

### **If Delete Not Working:**

1. Check searchId being passed
   ```javascript
   console.log('Deleting search ID:', searchId);
   // Must be valid ObjectId
   ```

2. Check backend delete endpoint
   ```javascript
   // searchController.js - deleteSearch()
   // Must handle searchId from URL params
   ```

3. Check frontend response handling
   ```javascript
   if (success) {
     setSearches(searches.filter((s) => s._id !== searchId));
   }
   // Must properly filter state
   ```

---

## 📊 Performance Monitoring

### **Database Query Performance**

```javascript
// Benchmark: Get recent searches
db.users.find({ _id: userId })
  .projection({ searchHistory: { $slice: [0, 6] } })
// Should be < 100ms

// Check indexes
db.users.getIndexes()
// searchHistory should be indexed if frequently queried
```

### **API Response Times**

- `POST /api/search/log`: < 200ms
- `GET /api/search/recent`: < 150ms
- `DELETE /api/search/:id`: < 150ms

### **Storage Limits**

- Max searches per user: 100 (configured)
- Typical document size: ~2-3KB per search
- Max user document size: ~300KB (100 searches)

---

## 🎯 Success Criteria

### **✅ All Tests Pass When:**

1. ✅ Search logged within 500ms
2. ✅ Appears in recent searches API within 1s
3. ✅ Component renders within 2s
4. ✅ Delete removes from UI and database
5. ✅ Clear all empties the array
6. ✅ Time display formatted correctly
7. ✅ First result preview shows (if available)
8. ✅ Deduplication works on retrieval
9. ✅ Data persists across sessions
10. ✅ User isolation maintained

---

## 🔗 Quick Links to Code

- [Search History Service](lib/searchHistoryService.js)
- [Recent Searches Component](components/RecentSearches.jsx)
- [Search Routes](backend/routes/search.js)
- [Search Controller](backend/controllers/searchController.js)
- [User Model](backend/models/User.js)
- [Search Dashboard](pages/SearchDashboard.jsx)

---

**Last Updated**: June 5, 2026
