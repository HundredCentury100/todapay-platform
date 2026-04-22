# Memory: accessibility/a11y-standards

Updated: now

The platform implements comprehensive accessibility standards:

## Hooks
- `useReducedMotion`: Detects prefers-reduced-motion preference
- `useMotionSafe`: Returns empty animation props when motion is reduced
- `useFocusTrap`: Traps focus within modals/dialogs with Escape key handling
- `useKeyboardNavigation`: Arrow key navigation for lists with Home/End support
- `useAnnounce`: Screen reader announcements via ARIA live regions

## Components
- `IconButton`: Icon-only button with required aria-label prop
- `VisuallyHidden`: Hides content visually but keeps it accessible
- `SkipLink`: Skip to main content link for keyboard users
- `LiveRegion`: ARIA live region wrapper for dynamic announcements

## CSS Standards
- `@media (prefers-reduced-motion: reduce)` disables all animations
- `@media (prefers-contrast: more)` enhances focus indicators
- `.sr-only` utility for screen reader text
- High contrast mode support via `.high-contrast` class

## Implementation
- Skip link in main.tsx targets `#main-content`
- Bottom navigation has `role="navigation"` and `aria-label`
- Nav items include `aria-current="page"` when active
- Icon-only buttons have `aria-hidden="true"` on icons
- Badge counts announced via aria-label (e.g., "Orders, 5 active")
- Motion library (`src/lib/motion.ts`) provides standardized animation presets
