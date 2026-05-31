# TasteScope Backend

This is the backend API for the TasteScope application, built with Node.js, Express, and Mongoose.

## Setup

1. Make sure MongoDB is installed and running on your system.
2. Navigate to the backend directory: `cd backend`
3. Install dependencies: `npm install`
4. Create a `.env` file with your MongoDB URI and JWT secret.
5. Run the server: `npm run dev` (for development with nodemon) or `npm start`

## API Endpoints

- `POST /api/auth/register` and `/api/auth/signup` - User registration (send firstName, lastName, email, password)
- `POST /api/auth/login` - User login (email & password)
- `POST /api/auth/forgot-password` - Send password reset email (email)
- `POST /api/auth/reset-password` - Change password (token, newPassword)
- `GET /api/auth/verify-email?token=…` - Complete email verification
- OAuth routes: `/api/auth/google`, `/api/auth/facebook`, `/api/auth/apple` and their callbacks

Local users store firstName, lastName, email, hashed password and provider; social users store provider and may have name field.

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default 5000)