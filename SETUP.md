# Quick Start Guide

Follow these steps to get your marketplace running:

## Step 1: Create Supabase Account (5 minutes)

1. Open https://supabase.com in your browser
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New Project"
4. Fill in:
   - Name: luam
   - Database Password: (create a strong password - save it!)
   - Region: Choose closest to you (Europe West for France)
6. Click "Create new project"
7. Wait 2-3 minutes for database to initialize

## Step 2: Get Supabase Keys

1. In your Supabase project, click "Project Settings" (gear icon, bottom left)
2. Click "API" in the left menu
3. You'll see:
   - Project URL (looks like: https://xxxxx.supabase.co)
   - anon public key (starts with: eyJhbGc...)
   - service_role key (starts with: eyJhbGc...)
4. Keep this tab open - you'll need these in Step 4

## Step 3: Set Up Database

1. In Supabase, click "SQL Editor" in the left menu
2. Click "New query"
3. Open the file `supabase-schema.sql` from your project folder
4. Copy ALL the content (Cmd+A, Cmd+C)
5. Paste it into the Supabase SQL Editor
6. Click "Run" (or press Cmd+Enter)
7. You should see "Success. No rows returned"

## Step 4: Create Storage Bucket

1. In Supabase, click "Storage" in the left menu
2. Click "Create a new bucket"
3. Name: listings
4. Make it PUBLIC (toggle the switch)
5. Click "Create bucket"

## Step 5: Create Stripe Account (10 minutes)

1. Open https://stripe.com
2. Click "Sign up"
3. Fill in your email and create password
4. Choose "France" as your country
5. Fill in business details:
   - Business type: Individual (or Company if you have one)
   - Your name
   - Your address
6. Complete phone verification

## Step 6: Enable Stripe Connect

1. In Stripe Dashboard, click "Connect" in the left menu
2. Click "Get started"
3. Choose "Platform or marketplace"
4. Click "Continue"
5. Under "Account types", enable "Express"
5. Fill in:
   - Platform name: Luam
   - Support email: your email
   - Platform website: http://localhost:3000 (for now)
7. Click "Save"

## Step 7: Get Stripe Keys

1. In Stripe Dashboard, click "Developers" in top right
2. Click "API keys"
3. You'll see:
   - Publishable key (starts with: pk_test_...)
   - Secret key (click "Reveal test key", starts with: sk_test_...)
4. Keep this tab open - you'll need these in Step 8

## Step 8: Configure Your App

1. Open the file `.env.local` in your project folder
2. Replace the placeholder values:

```bash
# From Step 2 (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# From Step 7 (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=

# Leave this as is
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file (Cmd+S)

## Step 9: Start Your App

1. Open Terminal
2. Navigate to your project:
   ```bash
   cd /Users/laylaphung/luam
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. You should see:
   ```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   ```

## Step 10: Test Your App

1. Open http://localhost:3000 in your browser
2. Click "Sign Up"
3. Create an account with your email
4. Check your email for verification link (check spam folder)
5. Click the verification link
6. Sign in with your credentials
7. Click "Sell Item" to create your first listing

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the full key from Supabase (no spaces)
- Make sure you saved the `.env.local` file
- Restart the dev server (Ctrl+C, then `npm run dev`)

### "Table does not exist" error
- Go back to Step 3 and run the SQL schema again
- Make sure you ran the ENTIRE file, not just part of it

### Images not uploading
- Check you created the "listings" bucket in Step 4
- Make sure the bucket is set to PUBLIC

### Can't sign up
- Check your email for verification link
- Check spam folder
- Try a different email address

### Port 3000 already in use
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `npm run dev -- -p 3001`

## What's Next?

Now that your app is running, you need to build:

1. **Listing detail page** - View individual items
2. **Stripe Connect onboarding** - Let sellers connect their bank account
3. **Checkout flow** - Buy items with Stripe
4. **Messaging** - Chat between buyers and sellers
5. **User profiles** - View seller profiles and ratings

I can help you build each of these features step by step!

## Need Help?

If you get stuck, tell me:
1. What step you're on
2. What error message you see (if any)
3. What you tried

I'll help you fix it!
