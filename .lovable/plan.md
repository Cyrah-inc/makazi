

## Problem

The landlord sidebar uses `min-h-screen` on the `<aside>` element. When rendered inside the mobile Sheet drawer, the sidebar's height is not constrained to the viewport — the nav section has `overflow-y-auto` but the parent `aside` uses `min-h-screen` which can push the user/sign-out section off-screen on short viewports.

## Plan

**File: `src/components/landlord/LandlordSidebar.tsx`**

Change the `<aside>` wrapper from `min-h-screen` to `h-full max-h-screen` so it fills the Sheet container and constrains to the viewport height. The nav section already has `overflow-y-auto` and `flex-1`, so it will become scrollable once the parent has a bounded height. The logo header and user footer remain pinned.

Single-line change on line 71:
- Before: `className="w-72 min-h-screen bg-card border-r border-border flex flex-col"`
- After: `className="w-72 h-full max-h-screen bg-card border-r border-border flex flex-col"`

This ensures on small mobile screens the navigation items scroll within the drawer while the logo and sign-out button stay visible.

