# Production readiness and deployment

## Required configuration

Use `server/.env.example` and `client/.env.example` as variable-name references. Put real values in the hosting provider's secret settings; do not commit `.env` files.

Use Node.js `20.19+`, `22.12+`, or `24+` for both server and client builds.

- `NODE_ENV=production`
- `DATABASE_URL` for PostgreSQL with TLS enabled
- Separate random values of at least 32 characters for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Cloudinary credentials
- `CLIENT_URL` as a comma-separated list of exact HTTPS frontend origins
- `FRONTEND_URL` as the frontend HTTPS origin used in email links
- A Resend API key and `RESEND_FROM_EMAIL` on a verified sending domain
- `VITE_API_URL` as the HTTPS API origin ending in `/api`; the production client build fails if it is absent or invalid
- `TRUST_PROXY` set to the number or value matching the hosting proxy topology; the default is one proxy in production

## Release sequence

1. Back up PostgreSQL and Cloudinary metadata before changing existing assets.
2. In the release/build environment, install server runtime dependencies with `npm ci --omit=dev` and client dependencies with `npm ci`.
3. In `server`, run `npm run prisma:generate` and then `npm run migrate:deploy` before starting the new release. These scripts fetch the pinned Prisma CLI for the release step; it is not installed in the API runtime dependency tree.
4. If the database contains older public CV, index-image, chat, or material assets, run each applicable migration script without `--apply` first. Resolve every unsupported reference before applying. For a confirmed clean dry run, back up again and rerun that script with `--apply`. After moving chat/material files, run `node scripts/verify-private-chat-material-files.js` and confirm every file is accessible through authorized downloads.
5. Migrations must run in the release/build step before the API starts; the server runtime install excludes development and Prisma CLI packages.
6. Build the client with the production `VITE_API_URL`, then start the API with `npm start`.
7. Confirm HTTPS, frontend CORS, WebSocket connections, email verification, password reset, uploads, authorized downloads, backups, and error monitoring in the deployed environment.

The Cloudinary migrations invalidate old delivery URLs, but CDN invalidation can take time. Keep the old assets and database backup until private downloads have been confirmed.

## Scaling notes

The current rate limiters use process-local memory. Run one API instance unless a shared rate-limit store is added. Multiple Socket.IO instances also need sticky sessions and a shared Socket.IO adapter so messages and notifications reach users connected to other instances.
