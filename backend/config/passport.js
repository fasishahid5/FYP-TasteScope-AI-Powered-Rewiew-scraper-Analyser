const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/User');

// only register a strategy if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(new Error('Google account did not provide an email'), null);
    }

    console.log('GoogleStrategy callback', email);
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      // Backfill googleId/name for older accounts matched by email.
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }
      if (!user.name && profile.displayName) {
        user.name = profile.displayName;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
      return done(null, user);
    } else {
      // split display name if available
      const names = (profile.displayName || '').split(' ');
      user = new User({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        name: profile.displayName,
        email,
        googleId,
        provider: 'google',
        isVerified: true, // Social auth is verified
        role: 'customer',
      });
      await user.save();
      console.log('GoogleStrategy created new user', user.id);
      return done(null, user);
    }
  } catch (err) {
    return done(err, null);
  }
}));
} // end google

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      console.error('FacebookStrategy: profile did not include an email:', profile.id);
      return done(new Error('Facebook account did not provide an email'), null);
    }

    console.log('FacebookStrategy callback', email);
    let user = await User.findOne({ email });
    if (user) {
      return done(null, user);
    } else {
      const names = (profile.displayName || '').split(' ');
      user = new User({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        name: profile.displayName,
        email,
        provider: 'facebook',
        isVerified: true,
        role: 'customer',
      });

      try {
        const savedUser = await user.save();
        console.log('✅ User successfully saved in Atlas:', savedUser);
        return done(null, savedUser);
      } catch (error) {
        console.error('❌ Error saving user to DB:', error.message);
        return done(error, null);
      }
    }
  } catch (err) {
    return done(err, null);
  }
}));
} // end facebook

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY_PATH) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    callbackURL: '/api/auth/apple/callback',
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
  }, async (accessToken, refreshToken, idToken, profile, done) => {
  try {
    const email = profile.email || idToken.email;
    console.log('AppleStrategy callback email', email);
    let user = await User.findOne({ email });
    if (user) {
      return done(null, user);
    } else {
      const fullName = (profile.name?.firstName || '') + ' ' + (profile.name?.lastName || '');
      user = new User({
        firstName: profile.name?.firstName || '',
        lastName: profile.name?.lastName || '',
        name: fullName.trim() || 'Apple User',
        email,
        provider: 'apple',
        isVerified: true,
        role: 'customer',
      });
      await user.save();
      console.log('AppleStrategy created new user', user.id);
      return done(null, user);
    }
  } catch (err) {
    return done(err, null);
  }
}));
} // end apple

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
