
# Performance Optimization Plan: Image Loading and App Speed

## Problem Summary

The app currently loads slowly due to several compounding issues:
- All images load at full resolution regardless of where they appear (thumbnail vs full-screen)
- All pages are bundled together and loaded upfront, even if the user never visits them
- Every property listing triggers a separate database call for landlord info (N+1 query problem)
- Fonts block the page from rendering until they download
- No images use browser-native lazy loading

---

## Optimization Strategy

### 1. Supabase Storage Image Transforms (Biggest Impact)

Supabase Storage supports on-the-fly image resizing via URL parameters. Instead of loading a 5MB original image for a small thumbnail, we request a resized version.

**What changes:**
- Create a helper function `getOptimizedImageUrl(url, width, quality)` in `src/lib/imageUtils.ts`
- For property card thumbnails: request 400px wide, 75% quality
- For property detail main image: request 800px wide, 80% quality
- For property detail thumbnails: request 160px wide, 70% quality
- For location section images: request 300px wide, 75% quality
- For admin/landlord dashboard thumbnails: request 100px wide, 70% quality

This alone can reduce image sizes by 80-90%.

### 2. Native Lazy Loading on All Images

Add `loading="lazy"` to all `<img>` tags so browsers only download images when they scroll into view. This is a simple HTML attribute change across 13 files.

**Files affected:** PropertyCard, PropertyDetailPage, LocationsSection, PropertyPreviewModal, PropertyImageUpload, UserFavoritesPage, UserBookingsPage, LandlordPropertiesPage, LandlordDashboard, LandlordInquiriesPage, UserInquiriesPage, AdminPropertiesPage, EditPropertyPage

### 3. Route-Based Code Splitting (Lazy Loading Pages)

Currently all 20+ page components are imported at the top of `App.tsx` and bundled into one large JavaScript file. With code splitting, each page only loads when the user navigates to it.

**What changes:**
- Convert all page imports in `App.tsx` to use `React.lazy()`
- Wrap `Routes` in a `Suspense` boundary with a loading spinner fallback
- This can reduce the initial JavaScript bundle by 60-70%

### 4. Fix N+1 Database Query (Landlord Profiles)

Currently, the `useProperties` hook fetches all properties, then makes a separate database call for each property's landlord profile. For 20 properties, that is 21 database calls instead of 1.

**What changes:**
- Modify `useProperties.ts` to batch-fetch all landlord profiles in a single query after getting properties
- This reduces database calls from N+1 to just 2, dramatically improving data load time

### 5. Skeleton Loading States for Property Cards

Instead of showing a blank page or spinner while images and data load, show placeholder skeleton cards that match the layout. This makes the app feel faster even when loading takes the same time.

**What changes:**
- Create a `PropertyCardSkeleton` component
- Use it in `PropertyGrid` while data is loading

### 6. Font Loading Optimization

The Google Fonts import in `index.css` blocks rendering. Moving it to an optimized `<link>` tag with `font-display: swap` lets the page render immediately with system fonts, then swaps to custom fonts when ready.

**What changes:**
- Remove the `@import` from `index.css`
- Add preconnect and preload font links in `index.html`
- Use `font-display=swap` parameter

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/lib/imageUtils.ts` | Image URL optimization helper for Supabase Storage transforms |
| `src/components/PropertyCardSkeleton.tsx` | Skeleton placeholder while property cards load |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/imageUtils.ts` | New utility: `getOptimizedImageUrl(url, width, quality)` that appends Supabase transform params |
| `src/components/PropertyCard.tsx` | Use optimized image URL (400px), add `loading="lazy"` |
| `src/pages/PropertyDetailPage.tsx` | Use optimized URLs for main image (800px) and thumbnails (160px), add `loading="lazy"` |
| `src/components/LocationsSection.tsx` | Use optimized image URLs (300px), add `loading="lazy"` |
| `src/components/PropertyGrid.tsx` | Show skeleton cards during loading state |
| `src/components/PropertyImageUpload.tsx` | Add `loading="lazy"` to preview images |
| `src/components/admin/PropertyPreviewModal.tsx` | Use optimized URLs, add `loading="lazy"` |
| `src/pages/user/UserFavoritesPage.tsx` | Use optimized URLs, add `loading="lazy"` |
| `src/pages/user/UserBookingsPage.tsx` | Use optimized URLs, add `loading="lazy"` |
| `src/pages/landlord/LandlordPropertiesPage.tsx` | Use optimized URLs, add `loading="lazy"` |
| `src/pages/landlord/LandlordDashboard.tsx` | Use optimized URLs, add `loading="lazy"` |
| `src/pages/landlord/LandlordInquiriesPage.tsx` | Add `loading="lazy"` |
| `src/pages/landlord/EditPropertyPage.tsx` | Add `loading="lazy"` |
| `src/pages/user/UserInquiriesPage.tsx` | Add `loading="lazy"` |
| `src/pages/admin/AdminPropertiesPage.tsx` | Add `loading="lazy"` |
| `src/App.tsx` | Convert all page imports to `React.lazy()`, add `Suspense` wrapper |
| `src/hooks/useProperties.ts` | Batch landlord profile queries to fix N+1 problem |
| `src/index.css` | Remove render-blocking `@import` for Google Fonts |
| `index.html` | Add optimized font loading with preconnect and `font-display=swap` |

### Implementation Order

1. Create `imageUtils.ts` helper (foundation for all image optimizations)
2. Update all image-heavy components with optimized URLs and lazy loading
3. Create skeleton components and integrate into PropertyGrid
4. Fix N+1 query in useProperties hook
5. Add code splitting to App.tsx
6. Optimize font loading in index.html and index.css

### Expected Impact

- **Image data transfer**: ~80-90% reduction (full-size to appropriately sized)
- **Initial JavaScript bundle**: ~60-70% reduction via code splitting
- **Database calls on listing pages**: From N+1 to 2 queries
- **First Contentful Paint**: Significantly faster with font optimization and code splitting
- **Perceived performance**: Much better with skeleton loading states
