

## Plan: Replace Hero with Jumia-inspired Property Showcase Carousel

### What we're building

Replace the current text + search bar hero section with a full-width, auto-rotating carousel that showcases top trending properties from Buy, Rent, and Airbnb categories. Each slide fills the hero area with the property's image as a background, overlaid with property details (title, location, price, category badge) and a "View Property" CTA. The search bar moves below the carousel. Think Jumia's homepage banner carousel but for real estate.

### Design

- Full-width carousel with ~6 slides (2 top trending from each category: buy, rent, airbnb)
- Each slide: full-bleed property image as background, dark gradient overlay, property info (title, location, price, purpose badge), and "View Details" button linking to `/property/:id`
- Category tab indicators (Buy / Rent / Airbnb dots or pills) alongside carousel dots
- Auto-advances every 5 seconds, pausable on hover
- Mobile: shorter height, stacked text, touch-swipeable via Embla
- The HeroSearch bar is preserved but moved below the carousel as a compact search strip

### New component

**`src/components/HeroCarousel.tsx`** — A new component that:
- Accepts trending properties from all 3 categories
- Uses Embla carousel (already installed) with autoplay loop
- Renders each property as a full-width slide with:
  - Background image with gradient overlay
  - Purpose badge (Buy / Rent / Airbnb) color-coded
  - Property title, location (county, town), formatted price
  - "View Details" button (Link to property page)
  - Bed/bath/size quick stats
- Dot indicators at the bottom
- Left/right arrow navigation (desktop)
- Auto-advances every 5s, pauses on hover/touch

### New hook

**`src/hooks/useHeroProperties.ts`** — Fetches top 2 trending from each category (sale, rent, airbnb) in a single hook, returning up to 6 properties with their purpose tagged. Uses the existing `fetchAndTransform` helper and `LISTING_COLUMNS`.

### Changes to Index.tsx

- Remove the old hero `<section>` (lines 79-101)
- Import and render `<HeroCarousel>` at the top, passing the hero properties
- Move `<HeroSearch>` below the carousel in a compact container with a subtle background
- Keep all existing property carousels below unchanged

### Files changed

| File | Change |
|------|--------|
| `src/hooks/useHeroProperties.ts` | New hook — fetches top 2 trending from buy, rent, airbnb |
| `src/components/HeroCarousel.tsx` | New component — full-width Embla carousel with property slides |
| `src/pages/Index.tsx` | Replace hero section with HeroCarousel + compact search bar below |

