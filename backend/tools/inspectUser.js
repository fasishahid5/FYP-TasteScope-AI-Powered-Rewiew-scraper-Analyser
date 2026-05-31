const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/tastescope';
const emailArg = process.argv[2];

(async () => {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const query = emailArg ? { email: emailArg } : {};
    const users = await User.find(query).lean();
    if (!users || users.length === 0) {
      console.log('No users found for query', query);
      process.exit(0);
    }
    users.forEach(u => {
      console.log('\n===');
      console.log('ID:', u._id.toString());
      console.log('Email:', u.email);
      console.log('Provider:', u.provider);
      console.log('Name:', u.firstName, u.lastName);
      console.log('Phone:', u.phone === undefined ? '(undefined)' : (u.phone === '' ? '(empty)' : u.phone));
      console.log('City:', u.city === undefined ? '(undefined)' : (u.city === '' ? '(empty)' : u.city));
      console.log('Country:', u.country === undefined ? '(undefined)' : (u.country === '' ? '(empty)' : u.country));
      console.log('Bio:', u.bio === undefined ? '(undefined)' : (u.bio === '' ? '(empty)' : u.bio.substring(0, 50)));
      console.log('AvatarUrl:', u.avatarUrl === undefined ? '(undefined)' : (u.avatarUrl === '' ? '(empty)' : u.avatarUrl.substring(0, 50) + '...'));
      console.log('CoverUrl:', u.coverUrl === undefined ? '(undefined)' : (u.coverUrl === '' ? '(empty)' : u.coverUrl.substring(0, 50) + '...'));
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
