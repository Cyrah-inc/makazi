

## Plan: Add Mobile Category Tabs + UX Simplification

### 1. Mobile Category Quick-Nav on Homepage

**`src/pages/Index.tsx`**
- Add a horizontal row of 3 pill-style buttons (Buy, Rent, Airbnb) visible only on mobile (`md:hidden`), placed between the Navbar and HeroCarousel
- Each links to `/buy`, `/rent`, `/airbnb` respectively with matching icons (Building, Key, Palmtree)
- Styled as compact rounded pills with icons, using the existing brand color tokens

### 2. UX Simplification Suggestions

Based on the current codebase, here are concrete improvements to reduce complexity:

**a) Reduce homepage carousel overload** — The homepage currently shows up to 9 carousels (Recently Viewed, Just Added, Trending, Nearby, Exotic, Land, Urban, Family Homes, plus the hero). This is overwhelming. Consolidate to 4-5 max:
- Keep: Hero, Just Added, Nearby, Trending
- Remove or merge: Land/Urban/Family into a single "Browse by Type" section with horizontal chips that filter one carousel
- Move Exotic Getaways into the Airbnb page only

**b) Simplify the hero carousel** — The hero takes up 65vh and shows detailed property info. On mobile, reduce to a simpler search-first hero with a prominent search bar and the category pills, rather than a full property showcase.

**c) Reduce duplicate navigation paths** — Users currently have: top navbar links, bottom nav "Browse", the hero carousel CTAs, category pills (proposed), and the CategorySection further down. Remove the CategorySection component from the homepage since the new mobile pills + navbar already cover this.

I'll implement item 1 (mobile category tabs). Items 2a-2c are presented as recommendations for you to approve separately, since they involve larger structural changes.

### Technical Details

- New component: inline in `Index.tsx` (simple enough to not need its own file)
- 3 `Link` components wrapped in a `div` with `flex md:hidden gap-2 px-4 py-3`
- Each pill: `rounded-full px-4 py-2 text-sm font-medium` with icon + label
- Uses existing color classes from the design system

