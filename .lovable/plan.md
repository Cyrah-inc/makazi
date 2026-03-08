

## Uniform Property Cards & Performance Improvements

### Problem Analysis

**Card uniformity**: Cards in carousels use `min-w-[280px] max-w-[320px]`, meaning widths vary. The content section has no fixed height, so cards with missing data (no bedrooms, no parking) appear shorter than others, creating an uneven carousel.

**Slow loading**: The main performance bottleneck is the PropertyCard image slideshow — it renders `<img>` tags for ALL images in a property (some may have 5-10+), even though only 1 is visible at a time. Each card eagerly creates DOM nodes and begins loading every image. On the homepage, with ~40+ cards across carousels, this means potentially 200+ images loading simultaneously. Additionally, the hero carousel loads 6 properties with `fetchPriority="high"` and `loading="eager"` for all slides.

### Plan

**1. Fix card uniformity in carousels**
- Change carousel card width from `min-w-[280px] max-w-[320px]` to a fixed `w-[300px]` so all cards are the same width
- Set a fixed minimum height on the card content section (`min-h-[180px]`) so cards align even when some properties have fewer features
- Always show bedrooms/bathrooms/size rows (display "—" or "0" for missing data) to maintain consistent vertical rhythm

**2. Only render the active image in PropertyCard (major perf fix)**
- Instead of rendering ALL images as hidden `<img>` elements, only render the current image (`images[currentIndex]`) and optionally preload the next one
- This eliminates 80%+ of unnecessary image loads across the page
- Keep the transition smooth by preloading `currentIndex ± 1` via `<link rel="prefetch">` or a hidden img for just the adjacent slides

**3. Limit hero carousel image loading**
- Only use `loading="eager"` and `fetchPriority="high"` on the first hero slide
- Set `loading="lazy"` on remaining hero slides since they're off-screen initially

**4. Fix the `fetchPriority` React warning**
- Change `fetchPriority="high"` to use the correct React 18 lowercase prop or remove it (React 18 doesn't support it natively — use a ref-based approach or just remove it)

### Files to modify
- `src/components/PropertyCard.tsx` — render only active + adjacent images instead of all
- `src/components/PropertyCarousel.tsx` — fixed card width, consistent content height
- `src/components/HeroCarousel.tsx` — lazy load non-first slides, fix fetchPriority warning

