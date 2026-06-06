const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const normalizeRole = (value) => {
  if (!value) return 'customer';
  const role = String(value).toLowerCase();

  // legacy roles
  if (role === 'analyst') return 'customer';
  if (role === 'business_owner') return 'owner';

  if (role === 'customer' || role === 'owner' || role === 'admin') return role;
  return 'customer';
};

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
  },
  lastName: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
  },
  // keep full name for convenience (social logins may only provide displayName)
  name: {
    type: String,
  },
  bio: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: '',
  },
  countryCode: {
    type: String,
    default: '',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  coverUrl: {
    type: String,
    default: '',
  },
  favorites: {
    type: [String],
    default: [],
  },
  reviews: {
    type: [
      {
        restaurantId: String,
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  restaurantVisits: {
    type: [
      {
        restaurantId: String,
        visitedAt: {
          type: Date,
          default: Date.now,
        },
        details: {
          restaurantId: String,
          name: String,
          image: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          lat: Number,
          lng: Number,
          placeId: String,
        },
      },
    ],
    default: [],
  },
  comparisons: {
    type: [
      {
        leftRestaurantId: String,
        rightRestaurantId: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        note: String,
        leftRestaurantDetails: {
          restaurantId: String,
          name: String,
          image: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          lat: Number,
          lng: Number,
          placeId: String,
        },
        rightRestaurantDetails: {
          restaurantId: String,
          name: String,
          image: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          lat: Number,
          lng: Number,
          placeId: String,
        },
      },
    ],
    default: [],
  },
  favoriteHistory: {
    type: [
      {
        restaurantId: String,
        favoritedAt: {
          type: Date,
          default: Date.now,
        },
        details: {
          restaurantId: String,
          name: String,
          image: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          lat: Number,
          lng: Number,
          placeId: String,
        },
      },
    ],
    default: [],
  },
  searchHistory: {
    type: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        query: String,
        restaurantId: String,
        resultCount: {
          type: Number,
          default: 0,
        },
        searchedAt: {
          type: Date,
          default: Date.now,
        },
        selectedRestaurantDetails: {
          restaurantId: String,
          placeId: String,
          name: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          image: String,
          lat: Number,
          lng: Number,
        },
        resultsShown: [
          {
            restaurantId: String,
            placeId: String,
            name: String,
            cuisine: String,
            priceRange: String,
            rating: Number,
            location: String,
            sentiment: Number,
            reviews: Number,
            image: String,
            lat: Number,
            lng: Number,
          },
        ],
        firstResultDetails: {
          restaurantId: String,
          placeId: String,
          name: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          image: String,
        },
      },
    ],
    default: [],
  },
  searchClicks: {
    type: [
      {
        query: String,
        selectedRestaurantId: String,
        selectedRestaurantDetails: {
          restaurantId: String,
          placeId: String,
          name: String,
          cuisine: String,
          priceRange: String,
          rating: Number,
          location: String,
          sentiment: Number,
          reviews: Number,
          image: String,
          lat: Number,
          lng: Number,
        },
        resultsShown: [
          {
            restaurantId: String,
            placeId: String,
            name: String,
            cuisine: String,
            priceRange: String,
            rating: Number,
            location: String,
            sentiment: Number,
            reviews: Number,
            image: String,
            lat: Number,
            lng: Number,
          },
        ],
        position: Number,
        clickedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
  },
  role: {
    type: String,
    enum: ['customer', 'owner', 'admin'],
    default: 'customer',
    lowercase: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'apple'],
    default: 'local',
  },
  ownerRequest: {
    status: {
      type: String,
      enum: ['none', 'draft', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    businessName: { type: String },
    restaurantName: { type: String },
    phone: { type: String },
    website: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String },
  },
  verificationToken: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Normalize legacy role values before validation
userSchema.pre('validate', function(next) {
  this.role = normalizeRole(this.role);
  next();
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
