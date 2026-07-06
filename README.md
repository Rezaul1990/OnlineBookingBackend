# OnlineBooking Backend

Express REST API for booking management.

## Environment

Create `.env` from `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Scripts

```bash
npm install
npm run dev
npm start
```

## Endpoints

- `GET /api/health`
- `GET /api/bookings`
- `POST /api/bookings`
