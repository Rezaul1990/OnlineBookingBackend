# OnlineBooking Backend

Express REST API foundation for OnlineBooking.

## Scripts

```powershell
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and set:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`

## API

```text
GET /api/health
```

Returns API and database status.

