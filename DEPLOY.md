# Deploy Luam for friends & reviews

The fastest way to share a public link is **Vercel** (free, made for Next.js).

## Before you deploy

1. Production build must pass locally:
   ```bash
   npm run build
   ```
2. You need a [Supabase](https://supabase.com) project with `supabase-schema.sql` applied and a public `listings` storage bucket.

## Step 1 — Push code to GitHub

```bash
cd /Users/laylaphung/luam
git add .
git commit -m "Prepare Luam for production deploy"
git branch -M main
```

Create a new repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/luam.git
git push -u origin main
```

## Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. **Add New Project** → import your `luam` repo.
3. Framework: **Next.js** (auto-detected). Root directory: `.`
4. Add **Environment Variables** (same as `.env.local`):

   | Name | Notes |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional for checkout |
   | `STRIPE_SECRET_KEY` | Optional |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://luam.vercel.app` |

5. Click **Deploy**. Wait ~2 minutes.

Your live URL will look like: `https://luam-xxxxx.vercel.app`

## Step 3 — Configure Supabase Auth (required)

In Supabase → **Authentication** → **URL configuration**:

- **Site URL**: `https://YOUR-VERCEL-URL.vercel.app`
- **Redirect URLs** (add both):
  - `https://YOUR-VERCEL-URL.vercel.app/**`
  - `http://localhost:3000/**` (keep for local dev)

Save, then test sign up / login on the live site.

## Step 4 — Share with friends

Send them the Vercel link. They can:

- Browse listings without an account
- Sign up → list items (+ Sell) → message sellers

## Optional: custom domain

Vercel → Project → **Settings** → **Domains** → add e.g. `luam.com`.

Update `NEXT_PUBLIC_APP_URL` and Supabase Site URL to match.

## CLI deploy (alternative)

```bash
cd /Users/laylaphung/luam
npx vercel login
npx vercel --prod
```

Follow prompts and add env vars in the Vercel dashboard afterward.
