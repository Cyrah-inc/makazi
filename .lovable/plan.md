

# AI Property Description Generator (ChatGPT)

## Overview
Add a "✨ Generate with AI" button next to the description textarea on the Add Property page. It uses the landlord's filled-in property details to generate a polished description via OpenAI's ChatGPT API. Only available to subscribed landlords.

## Architecture

```text
[AddPropertyPage] → supabase.functions.invoke('generate-description')
                          ↓
              [Edge Function] → OpenAI ChatGPT API
                          ↓
              Returns description text
```

## Changes

### 1. Store ChatGPT API Key
- Use the Supabase secrets tool to store `OPENAI_API_KEY` as a secret
- You will be prompted to paste your key

### 2. Edge Function: `supabase/functions/generate-description/index.ts`
- Accepts: title, category, bedrooms, bathrooms, amenities, location, pricing, tone (Professional / Friendly / Luxury)
- Authenticates the caller via `getClaims()`
- Checks subscription status server-side (queries `subscriptions` table)
- Calls OpenAI Chat Completions API (`gpt-4o-mini`) with a Kenyan real estate system prompt
- Returns the generated description (non-streaming, simple invoke)

### 3. Update `supabase/config.toml`
- Add `[functions.generate-description]` with `verify_jwt = false`

### 4. Update `src/pages/landlord/AddPropertyPage.tsx`
- Add a tone selector (Professional / Friendly / Luxury) and "✨ Generate with AI" button below the description textarea
- Button disabled + tooltip for non-subscribed landlords ("Subscribe to unlock AI descriptions")
- On click: collects form context, calls edge function, populates textarea with result
- Loading spinner while generating; landlord can freely edit the result
- Uses `useLandlordProfile` hook's `hasActiveSubscription` to gate access

### 5. Also update `src/pages/landlord/EditPropertyPage.tsx`
- Same AI button added to the description field for regenerating descriptions on existing listings

## Technical Details

**OpenAI call**: Uses `gpt-4o-mini` for cost efficiency. System prompt instructs the model to write a compelling 150-250 word Kenyan property listing description using the provided attributes. The tone parameter adjusts formality.

**Subscription gating**: Double-checked server-side in the edge function (defense in depth) by querying the `subscriptions` table for an active, non-expired subscription.

**No new npm dependencies** -- uses existing `supabase.functions.invoke()` pattern.

