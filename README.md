# Listwell

A mobile-first progressive web app that turns photos of items into ready-to-post marketplace listings. Snap photos, optionally describe the item via voice or text, and an AI agent handles product identification, market pricing research, listing description writing, and photo enhancement. The output is a complete listing ready to copy into Facebook Marketplace, eBay, Craigslist, or wherever you sell.

## How It Works

1. **Capture photos** of the item from different angles (1-5 photos)
2. **Optionally describe it** via voice dictation or text
3. **Tap "Generate"** and return to your feed
4. **AI agent works in the background** (30-90 seconds) — analyzing images, researching pricing, writing the listing, enhancing photos
5. **Get notified** when the listing is ready
6. **Review and copy** the complete listing into your marketplace of choice

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL ([Neon](https://neon.tech) prod / Docker local) |
| ORM | [Drizzle](https://orm.drizzle.team) |
| Auth | [BetterAuth](https://www.better-auth.com) (email/password) |
| UI | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4 |
| Image Storage | Vercel Blob |
| Background Jobs | [Inngest](https://www.inngest.com) |
| AI Agent | Vercel Sandbox + Claude AgentSDK |
| Image Enhancement | Google Gemini API |
| Notifications | Web Push API |
| Testing | Vitest + React Testing Library |
| Hosting | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/listwell.git
cd listwell

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Start local PostgreSQL
docker compose up -d

# Push the database schema
npx drizzle-kit push

# Start the dev server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (local: `postgresql://listwell:listwell@localhost:5433/listwell`) |
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000` for dev) |
| `BETTER_AUTH_SECRET` | Secret key for BetterAuth session encryption |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `INNGEST_EVENT_KEY` | Inngest event key |
| `INNGEST_SIGNING_KEY` | Inngest signing key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web push VAPID private key |

## Development

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript compiler check
npm run format       # Prettier
```

### Testing

```bash
npm run test                # Run all tests
npm run test -- --coverage  # Run with coverage report
npm run test:watch          # Watch mode
```

### Database

```bash
docker compose up -d         # Start local PostgreSQL
docker compose down          # Stop PostgreSQL
npx drizzle-kit push        # Push schema to database
npx drizzle-kit generate    # Generate migration files
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit studio      # Open Drizzle Studio (database GUI)
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── login/              # Login/Register screen
│   ├── (authenticated)/    # Protected routes (feed, new listing, detail)
│   └── api/                # API endpoints (auth, listings, images)
├── components/             # React components
│   └── ui/                 # shadcn/ui primitives
├── db/                     # Drizzle ORM client and schema
├── inngest/                # Background job definitions
├── lib/                    # Utilities, auth config, server actions
│   └── ai/                 # AI agent setup and prompts
└── types/                  # Shared TypeScript types
```

## License

Private project. All rights reserved.
