

## Plan: Improve PropertyMap Mobile UX

### Changes

**`src/components/PropertyMap.tsx`** -- Single file change

1. **Cleaner Google Maps UI**: Add options to hide default Google UI clutter:
   - `mapTypeControl: false` (already set)
   - Add `styles` to hide "Map Data", "Terms of Use" labels via `featureType: 'poi'` suppression
   - Set `controlSize: 28` for smaller default controls

2. **Three-way view switcher** (Map / Satellite / Street View): Replace the current two-state toggle button with a segmented button group offering three options:
   - **Map** (roadmap)
   - **Satellite** (hybrid)
   - **Street View** -- opens the Google Maps Street View panorama programmatically via `map.getStreetView().setPosition(center); map.getStreetView().setVisible(true)`
   - Style as a compact pill group in the top-left corner with icons + labels always visible

3. **Remove extra Google info on edges**: Set `disableDefaultUI: false` but specifically disable: `scaleControl: false`, `rotateControl: false`, `panControl: false`, and hide the Google logo overflow area by keeping the container `overflow-hidden` (already set).

### No changes needed for height
The height is already set to `clamp(400px, 85vw, 600px)` in PropertyDetailPage -- this is already tall on mobile.

### Technical Details

- The view switcher will be 3 buttons in a `div` with `flex gap-1` styling, positioned `absolute top-3 left-3`
- Street View toggle: when active, call `map.getStreetView().setVisible(true)` with position set to the property coordinates; when switching back, call `setVisible(false)`
- Use `Layers`, `Satellite`, `Map` icons from lucide-react for the three modes

