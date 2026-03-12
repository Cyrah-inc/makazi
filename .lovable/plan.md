

## Plan: Enhanced Hero Carousel with Integrated Search

### Concept

Overlay the existing `HeroSearch` bar on top of the hero carousel slideshow, creating a modern "search-over-hero" layout similar to Airbnb, Booking.com, and Zillow. The slideshow continues behind as an ambient backdrop, while the search bar becomes the primary interaction point.

### Changes

**1. `src/components/HeroCarousel.tsx`**
- Reduce hero height on mobile from `50vh/360px` to `45vh/320px` — the search bar adds visual weight
- Overlay the `HeroSearch` component centered vertically in the hero area (above the property info, below center)
- Add a welcome headline above the search: "Find Your Perfect Home in Kenya" in large white text
- Simplify per-slide content: remove the title, stats, and "View Details" button from the overlay — the slide becomes purely visual with just the category badge and price as a subtle bottom-left label
- Add a subtle Ken Burns (slow zoom/pan) CSS animation on the background images for a more dynamic feel
- Improve the gradient overlay to be stronger in the center where the search sits

**2. `src/pages/Index.tsx`**
- Pass no additional props — HeroSearch is self-contained and already navigates on submit
- Remove the mobile category quick-nav pills since the HeroSearch tabs (Buy/Rent/Airbnb) now serve that purpose directly in the hero

**3. `src/index.css`**
- Add a `@keyframes kenBurns` animation (slow 20s scale from 1.0 to 1.1 with alternate direction) for the hero background images

### Layout (Desktop)

```text
┌──────────────────────────────────────────────┐
│  [Background Image Slideshow]                │
│                                              │
│       Find Your Perfect Home in Kenya        │
│                                              │
│     ┌──[Buy]──[Rent]──[Airbnb]──┐            │
│     │ 🔍 Search │ County │ Type │ Search │   │
│     └────────────────────────────┘            │
│                                              │
│  ● For Sale          KSh 12,500,000          │
│  ○ ○ ● ○ ○                                   │
└──────────────────────────────────────────────┘
```

### Layout (Mobile)

```text
┌────────────────────────┐
│ [Background Slideshow] │
│                        │
│  Find Your Perfect     │
│  Home in Kenya         │
│                        │
│  [Buy][Rent][Airbnb]   │
│  ┌──────────────────┐  │
│  │ 🔍 Search...     │  │
│  │ County  │ Type   │  │
│  │    [Search]       │  │
│  └──────────────────┘  │
│                        │
│  ○ ○ ● ○               │
└────────────────────────┘
```

### Technical Details

- HeroSearch already handles navigation to `/buy`, `/rent`, `/airbnb` with query params — no routing changes needed
- Ken Burns animation uses CSS only (no JS), applied to the `<img>` element with `animation: kenBurns 20s ease-in-out infinite alternate`
- The slide's bottom overlay is simplified to just the badge + price in a small glassmorphism strip
- The search bar gets `backdrop-blur-md bg-card/90` for readability over any image
- Mobile pills in Index.tsx are removed since the HeroSearch tabs replace them

