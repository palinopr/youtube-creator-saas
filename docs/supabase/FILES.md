---
title: Supabase File Map
description: Optional waitlist backend (Supabase).
---

# Supabase File Map (`supabase/`)

These files support the optional marketing waitlist.

- `supabase/migrations/001_waitlist.sql`  
  Creates the `waitlist` table and related indices/constraints used by the landing
  waitlist form and confirmation flow.

- `supabase/functions/send-waitlist-confirmation/index.ts`  
  Supabase Edge Function that sends confirmation emails for waitlist signups.
  Called from `frontend/lib/supabase.ts` after a user submits the form.

