

## Plan: Revolut-Style Wallet + Core Features

Transform the wallet into a **Revolut-inspired financial dashboard** with a dark hero card, horizontal account stories, multi-currency pockets, analytics, and a swipeable action carousel.

---

### Visual Direction (Revolut-style)

1. **Dark gradient hero** — Black/near-black background with white text. Big balance at top, animated currency switcher, and small "+12.4% this month" trend chip.
2. **Account chips row** — Horizontal scrollable circles for each currency pocket (USD, ZAR, GBP, KES, etc.) with flag icons. Tap to switch active wallet.
3. **Action grid (4 icons)** — Compact circular icon buttons: Add money · Exchange · Transfer · More. Revolut's signature white-on-dark pill style.
4. **Analytics card** — Mini bar chart showing weekly spend by category (Bills, Travel, Food, Transfers) with horizontal swipe between time periods.
5. **Quick services strip** — Horizontal cards: Vaults, Stocks, Crypto, Insurance, Rewards (Revolut-inspired discoverability).
6. **Recent transactions** — Clean iOS-style list with merchant logos, category icons, timestamps, and grouped by date headers ("Today", "Yesterday").
7. **Floating "+" FAB** — Bottom-right action menu with quick-add money options.

---

### New Core Features

| Feature | Description |
|---|---|
| **Multi-Currency Pockets** | User holds separate balances per currency (USD, ZAR, GBP, ZWL, KES, NGN). Auto-convert on payment. |
| **Vaults / Savings Goals** | Create named savings buckets ("Holiday", "Emergency Fund") with target amounts, progress bars, round-up rules. |
| **Spend Analytics** | Visual breakdown by category (Bills, Travel, Transfers, Bookings) with month-over-month trends. |
| **Scheduled Payments** | Recurring bill payments + future-dated transfers. |
| **Split Bills** | Group expense splitter — invite friends by account number, track who owes what. |
| **Card Issuance (virtual)** | Generate virtual prepaid card numbers tied to wallet for online merchants. |
| **Spending Limits** | Daily/monthly caps per category for self-control. |
| **Crypto / Stocks tab** | Placeholder discovery card linking to a "Coming Soon" landing (or live if approved). |
| **Insurance Hub** | Travel insurance bundled with bookings. |
| **Statements export** | PDF/CSV monthly statements for the wallet. |

---

### Files to Create/Modify

**New components** (`src/components/wallet/revolut/`):
- `RevolutHero.tsx` — Dark hero with balance + currency switcher + trend chip
- `CurrencyPockets.tsx` — Horizontal scrollable currency circles
- `ActionGrid.tsx` — 4-icon Revolut-style action row (Add · Exchange · Transfer · More)
- `AnalyticsCard.tsx` — Weekly spend bar chart with category breakdown (recharts)
- `QuickServicesStrip.tsx` — Horizontal scroll cards (Vaults · Stocks · Crypto · Insurance · Rewards)
- `TransactionList.tsx` — Date-grouped transaction list with merchant avatars
- `FloatingActionMenu.tsx` — Bottom-right FAB with sheet menu

**New pages**:
- `src/pages/wallet/Vaults.tsx` — Savings vaults list + create flow
- `src/pages/wallet/VaultDetail.tsx` — Vault detail with deposit/withdraw + progress
- `src/pages/wallet/Analytics.tsx` — Full spend analytics (categories, merchants, trends)
- `src/pages/wallet/Exchange.tsx` — Currency exchange between pockets
- `src/pages/wallet/SplitBill.tsx` — Group expense splitter
- `src/pages/wallet/ScheduledPayments.tsx` — Recurring + future payments
- `src/pages/wallet/VirtualCard.tsx` — Generate/manage virtual card
- `src/pages/wallet/Statements.tsx` — Monthly statement export

**Refactor**:
- `src/pages/dashboard/WalletPage.tsx` — Replace current layout with Revolut composition
- `src/pages/PayPage.tsx` — Apply new hero + action grid (keep billers below)

**Database migrations**:
- `wallet_pockets` — multi-currency balances per user (`user_id`, `currency`, `balance`)
- `vaults` — savings goals (`user_id`, `name`, `target_amount`, `current_amount`, `currency`, `icon`, `color`)
- `vault_transactions` — deposits/withdrawals to vaults
- `scheduled_payments` — recurring/future payments (`user_id`, `recipient`, `amount`, `frequency`, `next_run`)
- `split_bills` + `split_bill_participants` — group expense tracking
- `virtual_cards` — issued virtual cards (`user_id`, `last4`, `cvv_encrypted`, `expires`, `is_active`)
- `transaction_categories` — derived category mapping for analytics

**Routes** (`src/App.tsx`):
- `/wallet/vaults`, `/wallet/vaults/:id`, `/wallet/analytics`, `/wallet/exchange`, `/wallet/split`, `/wallet/scheduled`, `/wallet/card`, `/wallet/statements`

---

### Color & Style Tokens

Add to `src/index.css`:
- `--revolut-bg: 240 5% 6%` (near-black hero)
- `--revolut-card: 240 4% 11%` (elevated dark card)
- `--revolut-accent: 220 100% 65%` (Revolut blue)
- New utility: `.revolut-hero` (dark gradient + white text), `.revolut-pill` (white/10 rounded-full backdrop-blur)

---

### Execution Order

1. Database migrations (pockets, vaults, scheduled, splits, cards)
2. Build Revolut design tokens + base components (Hero, ActionGrid, CurrencyPockets)
3. Refactor WalletPage with new layout + Analytics + QuickServices + TransactionList
4. Build Vaults pages (list, detail, create)
5. Build Exchange page (currency-to-currency conversion)
6. Build Split Bill, Scheduled Payments, Virtual Card, Statements pages
7. Register all new routes in App.tsx
8. Apply matching hero styling to PayPage for consistency

