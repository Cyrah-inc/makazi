

# Google OAuth, Password Toggle, and Premium Hero Redesign

## 1. Google OAuth -- Dashboard Configuration Only

The frontend code in `AuthPage.tsx` is already complete. You need to:
1. Go to **Supabase Dashboard** > Authentication > Providers > Enable Google
2. Create OAuth credentials in **Google Cloud Console** with redirect URI: `https://wbveiqffiooxaujccajq.supabase.co/auth/v1/callback`
3. Paste Client ID and Secret into the Supabase Google provider settings
4. In Supabase > Authentication > URL Configuration, add `https://makazi.lovable.app` as Site URL and redirect URL

No code changes needed for this part.

---

## 2. Password Visibility Toggle

**File: `src/pages/auth/AuthPage.tsx`**

- Add `showPassword` state
- Import `Eye` and `EyeOff` from lucide-react
- For both sign-in and sign-up password fields:
  - Change `type="password"` to `type={showPassword ? 'text' : 'password'}`
  - Add a toggle button with `Eye`/`EyeOff` icon inside the existing `relative` wrapper, positioned `absolute right-3`
  - Add `pr-10` to password inputs for icon clearance

---

## 3. Hero Section Redesign -- "Warm Luxury" Concept

Replace the current solid green hero with a premium dark-themed hero inspired by luxury real estate brands (Knight Frank, Sotheby's). This design uses CSS-only techniques -- no external images needed.

### Design Details

**Background:**
- Deep warm dark background using inline gradient: `from-[hsl(200,15%,10%)] via-[hsl(180,10%,14%)] to-[hsl(150,15%,12%)]`
- Subtle radial gold glow in the center (`bg-gold/10 blur-3xl`) for warmth
- Thin geometric accent lines using CSS borders (a horizontal gold line under the heading)

**Typography:**
- Large elegant heading: "Discover Exceptional" on line 1 (white), "Properties in Kenya" on line 2 with a gold gradient text effect using `bg-gradient-to-r from-gold via-amber-400 to-gold bg-clip-text text-transparent`
- Subtitle in muted warm white (`text-white/60`) with refined copy: "Verified homes, apartments, and land across 47 counties. Your next chapter starts here."

**Trust Bar:**
- A horizontal row of 3-4 stats with subtle dividers:
  - "10,000+ Properties"
  - "5,000+ Happy Clients" 
  - "47 Counties Covered"
  - "Verified Listings"
- Styled with `text-white/50` labels and `text-gold font-bold` numbers
- Sits between the heading and the search bar

**Search Card:**
- Wrapped in a container with a subtle gold border glow: `ring-1 ring-gold/20 shadow-2xl`
- The card itself stays white (`bg-card`) for contrast against the dark hero
- Slightly larger padding and rounded corners for a premium feel

**Purpose Tabs (HeroSearch):**
- Restyle from the current translucent white-on-green to work on dark background
- Tab strip: `bg-white/10 backdrop-blur-md` 
- Active tab: `bg-gold text-foreground` (gold highlight instead of white)
- Inactive: `text-white/70 hover:text-white`

**Bottom transition:**
- A subtle curved SVG divider or gradient fade from the dark hero into the light `bg-muted/30` content area below

### Files Changed

| File | Change |
|---|---|
| `src/pages/auth/AuthPage.tsx` | Add password visibility toggle with Eye/EyeOff icons |
| `src/pages/Index.tsx` | Replace green hero with dark luxury design, add trust bar, gold accents |
| `src/components/HeroSearch.tsx` | Restyle tabs for dark background (gold active state, translucent inactive) |

