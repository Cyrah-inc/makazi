

## Add Dark Theme to Makazi

The app already has dark mode CSS variables defined in `src/index.css` and uses `next-themes` (imported in sonner.tsx), but there's no `ThemeProvider` wrapping the app and no toggle UI for users to switch themes.

### Plan

**1. Wrap App with ThemeProvider**
- In `src/App.tsx`, import `ThemeProvider` from `next-themes` and wrap the app content with it (defaultTheme: "light", storageKey: "makazi-theme", attribute: "class")

**2. Create a Theme Toggle Component**
- Create `src/components/ThemeToggle.tsx` — a simple button that toggles between light/dark using `useTheme()` from `next-themes`
- Use Sun/Moon icons from `lucide-react`
- Style it to match the existing warm terracotta/earth tone design

**3. Add Toggle to Navbar**
- Add the `ThemeToggle` to the desktop Navbar (next to sign-in/profile actions)
- Add it to the mobile Sheet menu as well

**4. Add Toggle to Dashboard Sidebars**
- Add `ThemeToggle` to `LandlordSidebar`, `AdminSidebar`, and `UserSidebar` near the sign-out button so dashboard users can toggle theme too

**5. Refine Dark Mode CSS Variables**
- The existing `.dark` variables in `index.css` are already defined — review and tweak if needed for better contrast and readability with the Kenya-inspired palette (warm terracotta primary, earth tones)
- Ensure gradient utilities (`gradient-hero`, `gradient-card`) work well in dark mode
- Ensure scrollbar colors adapt to dark mode

No new dependencies needed — `next-themes` is already installed.

