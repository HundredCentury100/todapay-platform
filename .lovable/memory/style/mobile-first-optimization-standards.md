# Memory: style/mobile-first-optimization-standards
Updated: just now

The platform uses a 'MobileAppLayout' with safe-area padding and 48px+ touch targets. Key mobile-first standards include: full-width (100%) responsive sheets, bottom-sheet drawers for all booking forms, sticky bottom CTA bars on detail pages, and programmatically hiding the footer on small screens (md:hidden) to favor bottom navigation. Inputs and buttons follow a 12-pixel rounded corner standard, and containers use 'pb-24' to prevent navigation bar overlap. Pull-to-refresh is integrated on Activity, Pay, and Profile pages. Loading states are managed via vertical-specific skeleton loaders. Features in development (e.g., 'Send Money', 'QR Pay', card payments) are visually flagged with the 'ComingSoonBadge' component to manage user expectations without relying on interaction-triggered toasts.

## Phase 3: UI Polish Standards

### Card Design System (src/components/ui/card.tsx)
Standardized card variants with consistent border-radius (2xl base, 3xl for features):
- **default**: Static content display with subtle border
- **interactive**: Hover lift + shadow + active scale for clickable items  
- **elevated**: Prominent cards with shadow, no border
- **glass**: Frosted glass effect with backdrop-blur
- **feature**: Hero sections with larger 3xl radius
- **compact**: Smaller padding/radius for list items
- **outline**: Transparent with visible border
- **ghost**: Fully transparent

Card size variants: default, sm, lg (adjusts header/content/footer padding)

### Skeleton Pattern Library (src/components/ui/skeleton-patterns.tsx)
Comprehensive skeleton components for consistent loading states:
- **SkeletonCard**: Variants for vertical, horizontal, compact, feature, promo
- **SkeletonGrid**: Configurable grid (1-4 columns) of skeleton cards
- **SkeletonCarousel**: Horizontal scrollable skeletons (card, promo, event variants)
- **SkeletonSection**: Section wrapper with optional title skeleton
- **SkeletonListItem**: Activity/list items matching RecentActivity pattern
- **SkeletonStats**: Metrics/stats grid
- **SkeletonForm**: Form fields with button
- **SkeletonWallet**: Matches WalletWidget layout
- **SkeletonServiceGrid**: Matches ServiceGrid 4x2 layout
- **SkeletonQuickActions**: Horizontal scrollable action chips
- **SkeletonSearchBar**: Single input bar
- **SkeletonPageHeader**: Title + description
- **SkeletonHero**: Hero image + content

### Empty State System (src/components/ui/empty-state.tsx)
Enhanced with animations and actions:
- **EmptyState**: Full-featured with framer-motion animations, primary/secondary actions, size variants (sm/md/lg)
- **InlineEmptyState**: Compact inline variant for cards/sections
- **AddFirstEmptyState**: Prominent add button for empty collections
- Preset types include: no-favorites, no-messages, no-rides, no-stays, no-venues, etc.
- All presets include suggested navigation actions (e.g., "Browse events" → /events)
