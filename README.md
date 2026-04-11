# Claw Setup

A step-by-step onboarding wizard that lets anyone spin up their own OpenClaw AI assistant on Railway — no technical knowledge needed.

## What it does

1. Guides users through getting their API keys (Anthropic, Telegram)
2. Walks them through a friendly 5-step wizard
3. Validates their keys live before proceeding
4. Provisions a real OpenClaw instance on Railway
5. Lands them on a success page telling them to open Telegram

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (user records)
- Railway GraphQL API (provisioning)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings |
| `RAILWAY_API_TOKEN` | railway.com → Account Settings → Tokens |

### 3. Supabase migration

Run the migration in `supabase/migrations/001_create_claws.sql` against your Supabase project via the SQL editor or CLI.

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy

Push to GitHub. Connect the repo to Vercel. Add environment variables in Vercel dashboard. Deploy.

## Railway API Token

Get your Railway API token from: https://railway.com/account/tokens

The provisioning flow:
1. Creates a Railway project per user
2. Creates a service with Node 20
3. Injects env vars (Anthropic key, Telegram token, generated SOUL.md)
4. Triggers deployment

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/setup` | Prep checklist (get your keys first) |
| `/setup/wizard` | 5-step setup wizard |
| `/setup/success` | Confirmation + next steps |

## API Routes

| Route | Description |
|---|---|
| `POST /api/validate-anthropic` | Validates an Anthropic API key |
| `POST /api/validate-telegram` | Validates a Telegram bot token |
| `POST /api/provision` | Provisions a new Claw on Railway |
