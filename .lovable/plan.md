

# Replace User Dashboard Labels with "My Profile" Across All Menus

## Overview

Rename all references to "User Dashboard" and "Dashboard" in the user navigation to "My Profile" across the entire application. The current `UserDashboard` page already functions as a profile page (with avatar upload, personal info editing, and stats), so the labels just need to match.

---

## Changes Summary

All changes are simple text and icon swaps -- no logic or layout changes needed.

### 1. User Sidebar (`src/components/user/UserSidebar.tsx`)

- Change nav item label from **"Dashboard"** to **"My Profile"**
- Change the icon from `LayoutDashboard` to `User` (better represents a profile page)
- Update the subtitle text from **"My Account"** to **"My Profile"**

### 2. Navbar - Desktop Dropdown (`src/components/Navbar.tsx`)

- Change dropdown menu item text from **"User Dashboard"** to **"My Profile"**
- Change the icon from `LayoutDashboard` to `User`

### 3. Navbar - Mobile Side Menu (`src/components/Navbar.tsx`)

- Change the `MobileNavLink` label from **"User Dashboard"** to **"My Profile"**
- Change the icon from `LayoutDashboard` to `User`

### 4. Bottom Navigation (`src/components/BottomNav.tsx`)

- Already labeled **"Profile"** -- no change needed

---

## Technical Details

### Files Modified

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/user/UserSidebar.tsx` | 7 | `label: 'Dashboard'` to `label: 'My Profile'`, icon `LayoutDashboard` to `User` |
| `src/components/user/UserSidebar.tsx` | 43 | `"My Account"` subtitle to `"My Profile"` |
| `src/components/Navbar.tsx` | 134-138 | Desktop dropdown: `"User Dashboard"` to `"My Profile"`, `LayoutDashboard` icon to `User` |
| `src/components/Navbar.tsx` | 207 | Mobile menu: `"User Dashboard"` to `"My Profile"`, `LayoutDashboard` icon to `User` |

### No New Files

This is purely a labeling update -- no new components, routes, or database changes.

