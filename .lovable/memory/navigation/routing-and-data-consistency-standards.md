# Memory: navigation/routing-and-data-consistency-standards
Updated: just now

Platform navigation and routing are consolidated for consistency: '/activity' and '/bookings' are merged into a unified '/orders' route (Activity.tsx) with legacy redirects. Authentication redirects use the 'useAuthRedirect' hook and pass 'state: { returnTo: location.pathname }' (specifically in NotificationSettings, WorkspaceBookingForm, and DriverProfile) to ensure context persistence. All dead-end routes from the Profile and QuickActions menus are remediated with functional or placeholder pages: /saved (SavedPlaces), /promo (PromoCode), /referral (Referral), /vouchers (Vouchers), /legal (Legal), /rides (live history via Supabase), /payment-methods, and /promos. The 'RecentActivity' component on the home page fetches live data from Supabase 'bookings' and 'active_rides' tables. Key pages like Profile, Activity, and Pay include pull-to-refresh functionality.

## Missing Routes Remediation (Jan 2026)

### Consumer Dashboard Routes
All /dashboard/* routes redirect to /account/* equivalents:
- `/dashboard` → `/account`
- `/dashboard/bookings` → `/account/bookings`
- `/dashboard/rides` → `/rides`
- `/dashboard/wallet` → `/account/wallet`
- `/dashboard/transactions` → `/pay`
- `/dashboard/favorites` → `/saved`
- `/dashboard/rewards` → `/rewards`
- `/dashboard/settings` → `/account/settings`

### Profile Edit Route
- `/profile/edit` → ProfileEdit.tsx (functional form for name, phone, avatar)

### Driver Profile Routes
Added to Driver Portal layout:
- `/driver/vehicle` → DriverVehiclePage.tsx
- `/driver/documents` → DriverDocumentsPage.tsx
- `/driver/performance` → DriverPerformancePage.tsx

### Admin Financial Routes
Added under /merchant/admin/*:
- `/merchant/admin/financial` → FinancialOverview.tsx
- `/merchant/admin/merchant-billing` → MerchantBilling.tsx (admin view)
- `/merchant/admin/payment-verification` → PaymentVerification.tsx
- `/merchant/admin/billing-analytics` → BillingAnalytics.tsx
- `/merchant/admin/billing-control` → BillingControl.tsx

### Merchant Billing Routes
Shared components in src/pages/merchant/shared/:
- MerchantBillingPage.tsx - Invoice history and payment
- MerchantRevenuePage.tsx - Earnings and payout tracking
- MerchantPaymentPortalPage.tsx - Payment submission portal

Added /billing and /payment-portal routes to:
- Bus Operator
- Event Organizer
- Venue Owner
- Property Owner
- Airline Partner
- Workspace Provider
- Car Rental
- Transfer Provider
- Experience Host

## Phase 2 Improvements (User Logic)

### Enhanced Booking Continuity
- Upgraded from sessionStorage to localStorage for cross-session persistence (7 days vs 24 hours)
- Supports multiple saved booking drafts (up to 5)
- Each draft has unique ID, createdAt, and updatedAt timestamps
- ContinueBookingCard shows most recent draft prominently with expandable list of other drafts
- getBookingAge utility shows relative time with "isRecent" flag for visual emphasis
- Toast notification when progress is saved: "Progress saved - Your booking has been saved"

### Smart Defaults & Personalization (useUserPreferences hook)
- Remembers last payment method used and preferences array
- Saves up to 5 travelers with name/email/phone/passport
- Tracks favorite routes with usage count (sorted by frequency)
- Stores recent searches with type and timestamp
- Tracks visit count and last visit for returning user detection
- Preferences stored in localStorage under "user_preferences" key

### SmartTravelerForm Component
- Dropdown to select from saved travelers
- Auto-fills form with default traveler when empty
- Shows prompt to save new traveler details if not matching saved
- Pre-fills logged-in user's email automatically

### Guest Checkout Improvements
- AccountBenefitsCard component (reusable, variants: inline/compact)
- InlineAccountPrompt for showing sign-in prompt during checkout flow
- Auth page accepts prefillEmail in state to pre-populate email field
- Benefits shown: offline access, tracking, rewards, faster checkout

### Returning User Optimizations
- Index.tsx reduces animation delays for returning users (2ms vs 5ms base delay)
- Uses getUserPreferences().visitCount to detect returning users
