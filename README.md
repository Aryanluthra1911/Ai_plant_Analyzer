# Verdant — AI Plant Analyzer

A Next.js App Router application for private plant photo analysis and a saved garden journal. Analysis uses server-side Google Gemini calls; development can store images privately on disk, while production uses a private S3-compatible bucket. Photo-based suggestions are not guaranteed diagnoses.

## Requirements

- Node.js 20 or later and npm
- PostgreSQL (Neon is supported)
- A Google Gemini API key
- Private S3-compatible object storage for production uploads (AWS S3, Cloudflare R2 with an S3 endpoint, or another compatible service)

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and fill in the server-only values below.
3. Generate a strong session secret, for example with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
4. Apply database migrations with `npm run db:deploy` and generate the Prisma client with `npm run db:generate`.
5. Start the development server with `npm run dev` and open `http://localhost:3000`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL pooled/application connection string. |
| `DIRECT_URL` | Direct PostgreSQL connection for Prisma migrations. |
| `AUTH_SECRET` | Random secret used to sign Auth.js sessions. Keep it private. |
| `GEMINI_API_KEY` | Server-side Google Gemini API key. Never prefix it with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL` | Optional Gemini model identifier; defaults to `gemini-3.8-flash`. |
| `S3_REGION` | Region for the private image bucket. |
| `S3_BUCKET` | Private bucket name. |
| `S3_ACCESS_KEY_ID` | Server-side storage access key. |
| `S3_SECRET_ACCESS_KEY` | Server-side storage secret. |
| `S3_ENDPOINT` | Optional custom S3-compatible endpoint. |
| `LOCAL_STORAGE_DIR` | Optional private local image directory for development; defaults to `.data/uploads` and is ignored by Git. |

Do not commit `.env`. `.gitignore` excludes local environment files and `.data/`. With `NODE_ENV=development` and `S3_BUCKET` blank, images are saved privately under `.data/uploads`; this fallback is disabled in production. Use the deployment platform's secret manager for production values. The S3 bucket should be private; the app serves images only after checking the signed-in user's ownership.

## Database commands

- `npm run db:generate` — generate Prisma Client after schema changes.
- `npm run db:migrate` — create and apply a development migration.
- `npm run db:deploy` — apply checked-in migrations in deployment.

The `User` model stores a bcrypt password hash. `PlantAnalysis` belongs to one user and stores report JSON and private object metadata. `ApiRateLimitWindow` stores hashed rate-limit identifiers and fixed-window request counts; it does not store raw client IP addresses.

## Gemini configuration

The app sends supported image bytes and optional plant context from the server to Gemini, requests JSON output, validates the report, and stores the validated result. If the key is missing, a request is rate limited, the model times out, or a response is invalid, the API returns a sanitized error and the uploaded object is removed where possible. A successful model-list request does not prove that image generation is available; configure the key and make a real analysis request to confirm the account's access and quota.

## Checks

- `npm test` — Node test suite.
- `npm run build` — optimized Next.js production build.
- `npm start` — serve a production build.

## Deployment

Deploy on a Node.js-compatible Next.js host. Configure every environment variable in the host's secret manager, provision a private S3-compatible bucket, and apply migrations with `npm run db:deploy` as a release step before serving traffic. Ensure the runtime can reach PostgreSQL, Google Generative Language API, and the object store. Use HTTPS in production; security headers, including HSTS, are enabled for production builds.

## Security and operational notes

- Protected pages and API routes require an Auth.js session.
- Analysis reads, image reads, and deletions scope database queries to the signed-in owner. Missing or foreign IDs return 404.
- Uploads accept JPEG, PNG, and WEBP only, check file signatures, and are capped at 10 MB.
- API request limits use PostgreSQL fixed-window counters. If the rate-limit store is unavailable, limited routes fail closed with a generic 503.
- Deleting an analysis removes its image object before deleting its database row; a storage failure leaves the report available for retry.
- Gemini analysis is advisory and may be uncertain. The model API POST and production upload flow still require live configuration and verification.
- The runtime must support Next.js route handlers and Prisma. For high-volume deployments, review database connection pooling, request limits, and storage cleanup monitoring.
