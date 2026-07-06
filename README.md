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
OWNER_NAME=Owner User
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=change_this_owner_password
```

## Scripts

```bash
npm install
npm run dev
npm start
npm run seed:owner
```

## Endpoints

- `GET /api/health`
- `GET /api/bookings`
- `POST /api/bookings`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/permissions`
- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `GET /api/admin/users`
- `POST /api/admin/users`

## Owner Setup

1. Add `MONGODB_URI`, `JWT_SECRET`, `OWNER_NAME`, `OWNER_EMAIL`, and `OWNER_PASSWORD` to `backend/.env`.
2. Run `npm run seed:owner`.
3. Sign in from the frontend admin login page with the owner email/password.
