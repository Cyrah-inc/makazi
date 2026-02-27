

# Plan: Mortgage Calculator + Native-Style Mobile Footer

## 1. Mortgage Calculator Component

**New file: `src/components/MortgageCalculator.tsx`**

An interactive calculator card with:
- **Inputs**: Property price (pre-filled from sale price), down payment (% slider + KES amount), loan term (5-30 years slider), interest rate (default ~14% for Kenya market)
- **Outputs**: Monthly payment, total interest paid, total amount paid
- **Formula**: Standard amortization formula `M = P[r(1+r)^n] / [(1+r)^n - 1]`
- Uses existing UI components: Card, Slider, Input, Label
- Formatted with `formatFullPrice` from `src/lib/formatters.ts`

**Modified: `src/pages/PropertyDetailPage.tsx`**

- Import and render `<MortgageCalculator salePrice={property.salePrice} />` in the sidebar, below the Price Card, only when `property.purposes.includes('buy') && property.salePrice`

## 2. Mobile Footer Redesign (Native App Feel)

**Modified: `src/components/Footer.tsx`**

On mobile (below `md` breakpoint), replace the full 4-column footer with a compact, app-style layout:
- A minimal section with just the brand logo, copyright line, and Privacy/Terms links
- Styled as a slim card above the bottom nav area with `pb-20` for bottom nav clearance
- Remove the newsletter, contact details, and social icons on mobile (they clutter native feel)
- Keep the full desktop footer unchanged for `md+` screens

This uses responsive classes (`hidden md:block` / `block md:hidden`) to swap between the two versions, ensuring the app feels native on mobile while retaining the full footer on desktop.

### Files Summary

| File | Change |
|------|--------|
| `src/components/MortgageCalculator.tsx` | New -- calculator with sliders and amortization math |
| `src/pages/PropertyDetailPage.tsx` | Add mortgage calculator in sidebar for buy properties |
| `src/components/Footer.tsx` | Replace mobile footer with compact native-style version |

