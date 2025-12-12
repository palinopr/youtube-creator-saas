# TubeGrow Waitlist Setup Guide

## Overview
This guide walks you through setting up the waitlist system with Supabase.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** (e.g., `https://abcxyz.supabase.co`)
3. Note your **anon/public key** from Settings > API

## Step 2: Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `supabase/migrations/001_waitlist.sql`
3. Click **Run** to create the waitlist table

## Step 3: Deploy Edge Function

### Option A: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Set Resend API key secret
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set FRONTEND_URL=https://tubegrow.io

# Deploy the function
supabase functions deploy send-waitlist-confirmation
```

### Option B: Via Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create a new function**
3. Name it `send-waitlist-confirmation`
4. Copy the code from `supabase/functions/send-waitlist-confirmation/index.ts`
5. Set secrets:
   - `RESEND_API_KEY` - Get from [resend.com](https://resend.com)
   - `FRONTEND_URL` - Your frontend URL (e.g., `https://tubegrow.io`)

## Step 4: Configure Frontend Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 5: Configure Resend Email

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (tubegrow.io)
3. Create an API key
4. Add it as a secret in Supabase (see Step 3)

### Email Sender Configuration

In `supabase/functions/send-waitlist-confirmation/index.ts`, update the `from` field:
```typescript
from: "TubeGrow <noreply@tubegrow.io>",
```

## Step 6: Test the Flow

1. Start your frontend: `npm run dev`
2. Navigate to the landing page
3. Enter an email and submit
4. Check:
   - Supabase dashboard for the new row in `waitlist` table
   - Email inbox for confirmation email
   - Click confirmation link to test the confirm page

## Production Checklist

- [ ] Supabase project created
- [ ] Migration run (`001_waitlist.sql`)
- [ ] Edge function deployed
- [ ] `RESEND_API_KEY` secret set
- [ ] `FRONTEND_URL` secret set to production URL
- [ ] Domain verified in Resend
- [ ] Frontend env vars set in Vercel

## Files Created

| File | Description |
|------|-------------|
| `supabase/migrations/001_waitlist.sql` | Database schema |
| `supabase/functions/send-waitlist-confirmation/index.ts` | Email edge function |
| `frontend/lib/supabase.ts` | Supabase REST API client |
| `frontend/components/landing/WaitlistForm.tsx` | Email capture form |
| `frontend/app/waitlist/confirm/page.tsx` | Email confirmation page |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/components/landing/Header.tsx` | "Join Waitlist" CTA |
| `frontend/components/landing/HeroSection.tsx` | Added waitlist form |
| `frontend/components/landing/FinalCTA.tsx` | Added waitlist form |
