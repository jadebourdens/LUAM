# Luam - Marketplace Platform

A full-featured marketplace platform like Vinted, built with Next.js, Supabase, and Stripe Connect. Supports multi-currency transactions (EUR, USD, VND) with automatic 5% platform fee.

## Features

- User authentication (sign up, login, profile)
- Create and browse listings with images
- Multi-currency support (EUR, USD, VND)
- Stripe Connect payment processing with 5% platform fee
- Real-time messaging between buyers and sellers
- Order management and tracking
- User ratings and reviews
- Favorites/wishlist

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe Connect

## Setup Instructions

### 1. Install Dependencies

Already done! Dependencies are installed.

### 2. Set Up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Wait for the database to be ready (2-3 minutes)
4. Go to Project Settings > API
5. Copy your project URL and anon key
6. Go to SQL Editor and run the entire `supabase-schema.sql` file
7. Go to Storage and create a new bucket called `listings` (make it public)

### 3. Set Up Stripe

1. Go to https://stripe.com and create an account
2. Go to Developers > API keys
3. Copy your Publishable key and Secret key
4. Enable Stripe Connect:
   - Go to Connect > Settings
   - Enable Express accounts
   - Fill in your business details
5. For webhooks (later):
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `account.updated`

### 4. Configure Environment Variables

Edit `.env.local` and fill in your keys:

```bash
# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe (from step 3)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (leave empty for now)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
luam/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   ├── signup/page.tsx         # Signup page
│   │   └── signout/route.ts        # Sign out handler
│   ├── listings/
│   │   └── new/page.tsx            # Create listing page
│   └── page.tsx                    # Homepage
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   └── stripe.ts                   # Stripe utilities
├── types/
│   └── database.ts                 # TypeScript types
└── supabase-schema.sql             # Database schema
```

## Next Steps

### Phase 1: Complete Core Features (You are here)
- [x] Authentication (login, signup)
- [x] Create listings
- [x] Browse listings
- [ ] View single listing details
- [ ] Stripe Connect seller onboarding
- [ ] Checkout and payment flow

### Phase 2: Communication
- [ ] Real-time messaging
- [ ] Notifications

### Phase 3: Trust & Safety
- [ ] User ratings and reviews
- [ ] Report listing/user
- [ ] Order tracking

### Phase 4: Polish
- [ ] Search and filters
- [ ] User profiles
- [ ] Favorites
- [ ] Email notifications

## Database Schema

The database includes these main tables:
- `profiles` - User profiles (extends Supabase auth)
- `listings` - Item listings with multi-currency prices
- `listing_images` - Images for listings
- `orders` - Purchase orders with Stripe payment info
- `messages` - Chat messages between users
- `conversations` - Message threads
- `reviews` - User ratings and reviews
- `favorites` - Saved listings
- `categories` - Item categories

## Payment Flow

1. Buyer clicks "Buy Now" on a listing
2. Seller must have completed Stripe Connect onboarding
3. Buyer enters shipping address and payment details
4. Stripe charges buyer (e.g., €100)
5. Platform automatically takes 5% (€5)
6. Seller receives 95% (€95) in their Stripe account
7. Seller ships item and adds tracking number
8. Buyer confirms receipt
9. Order marked as complete

## Currency Conversion

The app stores prices in all three currencies:
- EUR (base currency)
- USD (1 EUR = 1.08 USD)
- VND (1 EUR = 27,000 VND)

Note: Exchange rates are hardcoded. For production, use a real-time currency API like:
- https://exchangerate-api.com (free tier: 1,500 requests/month)
- https://fixer.io
- https://openexchangerates.org

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables from `.env.local`
5. Deploy!

Your app will be live at `https://your-app.vercel.app`

### Update Stripe Webhook

After deployment:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Copy the webhook secret
4. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Legal Requirements

Before launching publicly:

1. **Business Registration**: Register as a business (auto-entrepreneur in France)
2. **Terms of Service**: State your 5% commission, refund policy, prohibited items
3. **Privacy Policy**: GDPR-compliant privacy policy
4. **Cookie Consent**: Cookie banner for EU users
5. **Seller Agreement**: Terms for sellers using your platform

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs
- Check Stripe Connect docs: https://stripe.com/docs/connect
- Check Next.js docs: https://nextjs.org/docs

## License

MIT
