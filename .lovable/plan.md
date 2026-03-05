

# Fix WhatsApp Button - Blocked in Preview Iframe

## Root Cause

The Lovable preview runs inside an iframe. When the user clicks an `<a target="_blank">` link, the browser may still render the navigation within the iframe's security context. The `wa.me` URL redirects to `api.whatsapp.com`, which sets `X-Frame-Options: DENY`, causing "refused to connect."

Both `<a target="_blank">` and `window.open()` have been tried individually and failed. The fix is to **combine both**: use an `<a>` tag for semantics/accessibility but intercept the click with `window.open()` via an `onClick` handler that uses `e.preventDefault()`. Additionally, add `target="_top"` (not `_blank`) so if `window.open` is blocked, the fallback navigates the **top-level** browser window out of the iframe entirely.

## Changes

### `src/components/chat/WhatsAppButton.tsx`
- Add `onClick` handler: `e.preventDefault(); window.open(url, '_blank', 'noopener,noreferrer')`
- Change `target` from `_blank` to `_top` as fallback

### `src/pages/PropertyDetailPage.tsx`
- Same fix for the floating mobile WhatsApp button: add `onClick` with `window.open()` + `e.preventDefault()`, change target to `_top`

