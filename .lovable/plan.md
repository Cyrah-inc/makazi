## Plan

### 1. Make only Title Deed mandatory for sale listings

Currently both Title Deed AND Land Search Certificate are required when a landlord lists a property for sale. Make only the Title Deed mandatory; Land Search and the third slot become optional.

**Files**
- `src/pages/landlord/AddPropertyPage.tsx`
  - Line ~172: change validation from `!formData.saleDocuments[0] || !formData.saleDocuments[1]` to `!formData.saleDocuments[0]`
  - Update toast message to "Please upload the Title Deed for sale listings"
  - Line ~534: change `Land Search Certificate *` label to `Land Search Certificate (optional)`
- `src/pages/landlord/EditPropertyPage.tsx`
  - Mirror the same two changes (validation + label)

Admin verification flow and `SaleDocumentsCard` continue to display whatever docs are uploaded — no changes needed there.

### 2. Fix "Generate with AI" description button

The button calls the `generate-description` edge function which depends on `OPENAI_API_KEY` and gates by active subscription. Two issues:
- If OpenAI quota/key is invalid the call fails silently with a generic error.
- Subscription check blocks testing.

**Fix**
- Rewrite `supabase/functions/generate-description/index.ts` to use the **Lovable AI Gateway** (`LOVABLE_API_KEY`, model `google/gemini-2.5-flash`) instead of OpenAI. This gateway is always available in Lovable Cloud, no extra setup.
- Keep the subscription gate (existing business rule), but return clearer error messages (`401`, `402`, `429` handling) so the toast surfaces the real reason ("Subscription required", "AI credits exhausted", etc.).
- Keep the same request/response shape so the frontend code is unchanged.

```ts
// new core call
const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  }),
});
```

### 3. Convert the project into a native mobile app (Capacitor)

Per Lovable's mobile guidance, set up Capacitor so the existing React app can be packaged as a real iOS/Android app published to the App Store / Play Store.

**Steps**
1. Install: `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`.
2. Create `capacitor.config.ts` at project root:
   - `appId`: `app.lovable.17432d3a7189414aa058083823c358d5`
   - `appName`: `makazi`
   - `webDir`: `dist`
   - `server.url`: `https://17432d3a-7189-414a-a058-083823c358d5.lovableproject.com?forceHideBadge=true` (hot-reload from sandbox)
   - `server.cleartext`: `true`
3. After files land, the user must, on their own machine:
   - Export project to GitHub → `git pull` locally
   - `npm install`
   - `npx cap add ios` and/or `npx cap add android`
   - `npm run build && npx cap sync`
   - `npx cap run ios` (Mac + Xcode) or `npx cap run android` (Android Studio)

I will include these instructions clearly after implementation. Reference: https://lovable.dev/blog/2025-03-25-the-complete-guide-to-building-mobile-apps-with-lovable

**Note on PWA**: not enabling vite-plugin-pwa (per Lovable preview iframe constraints). Capacitor alone covers true native deployment.

### Out of scope
- No changes to admin verification UI or to `SaleDocumentsCard` empty state (already handled).
- No change to existing fee structure or booking flow.
