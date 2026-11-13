# GlobalPride-Admin

Admin dashboard SPA. React 19 + TypeScript + Vite 8, Tailwind CSS v4, React Router 7, Zustand, Axios, Recharts. Package manager: **yarn (v1)**.

## Commands

- `yarn dev` — start dev server
- `yarn build` — typecheck (`tsc -b`) then production build. Run this to verify changes.
- `yarn lint` — ESLint
- `yarn preview` — serve the production build

There is no test runner set up.

## Structure

```
src/
  api/
    axios/client.ts        # shared axios instance (baseURL from env)
    axios/interceptors.ts  # auth header, 401 → refresh → retry, error normalization (imported once in main.tsx)
    services/              # one file per API domain, e.g. authService
  components/              # reusable UI primitives, all prefixed `WebApp*`
  config/env.ts            # typed access to VITE_* env vars
  data/mock.ts             # placeholder data used by pages until APIs are wired in
  hooks/                   # zustand stores / hooks (useAuth = persisted auth store)
  layouts/AdminLayout.tsx  # authenticated shell: Sidebar + Topbar + <Outlet />
  pages/                   # route screens, re-exported from pages/index.ts (dashboard/ has its own folder)
  routes/RequireAuth.tsx   # guard for protected routes
  types/                   # shared types + module augmentation (axios.d.ts, env.d.ts)
  utils/                   # cn() class helper, token/refresh helpers
```

## Conventions

- Import from `src` via the `@/` alias (e.g. `@/components/Button`), not long relative paths.
- Named exports for components and pages (`export const Dashboard = ...`). `App`, `RequireAuth` and `AdminLayout` are default exports.
- Styling is Tailwind only. Merge class names with `cn()` from `@/utils/cn` so a caller's `className` overrides defaults.
- Brand colors live in the `@theme` block of `src/index.css` (`--color-primary` → `bg-primary`, `text-primary`, …). Add new tokens there rather than hard-coding hex values.
- UI components accept `className` for the main element and `containerClassName` for the outer wrapper.
- Build pages from the existing `WebApp*` components (`Card`, `PageHeader`, `Button`, `Input`, `Modal`, `Badge`, `Avatar`, `DetailList`, …) before writing new markup.
- New protected routes go inside the `<AdminLayout />` route in `App.tsx`, and get a sidebar entry in `src/layouts/Sidebar.tsx`. Route paths are lowercase.
- Forms use react-hook-form + yup (`yupResolver` from `@hookform/resolvers/yup`). Put schemas in `src/schemas/` and derive types with `yup.InferType`. Spread `{...register("field")}` onto `WebAppInput` / `WebAppTextarea` / `WebAppCheckbox` and pass `errors.field?.message` as `error`; wrap `WebAppSelectInput` in a `Controller`. Add `noValidate` to the `<form>` so yup's messages are shown, not the browser's.
- Charts use Recharts; pass colors as CSS vars (e.g. `var(--color-primary)`) so they follow the theme.

## API & auth

- Use `apiClient` from `@/api/axios/client`; add calls to a service in `src/api/services/`.
- Pass `{ useAuth: true }` in the request config to send the Bearer token. Only those requests attempt a token refresh on 401.
- Rejected requests reject with a normalized `ApiError` (`message`, `status`, `code`, `details`) — see `src/types/api-response.ts`.
- Backend responses are shaped as `ApiResponse<T>` (`isSuccess`, `result`, `message`, …).
- Auth state (`token`, `refreshToken`, `isAuthenticated`) lives in `useAuth` and is persisted to localStorage. Call `useAuth.getState().login({ token, refreshToken })` after a successful login; `logout()` clears it.

## Environment

Copy `.env.example` to `.env`. Variables: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_API_VERSION` (typed in `src/types/env.d.ts`). `.env` is git-ignored.

## Notes

- Pages are not connected to the API yet — they read from `src/data/mock.ts`. User Management (`/users`, `/users/:userId`, `/users/:userId/activity`) reads from the in-memory `useUsers` store so suspend / activate / delete work across pages; per-user campaign, wallet and activity history is the same mock list for every user. Replace those imports when wiring services. Campaign Management (`/campaigns`, `/campaigns/:campaignId`, `/campaigns/:campaignId/recipients`) reads `mockCampaigns` directly (read-only), and its flag banner shows the campaign's open compliance flags; each campaign's recipients and log are derived from its status by `getCampaignRecipients` / `getCampaignLog` in `mock.ts`. Campaign URLs use the public ID (e.g. `GP-2026-00321`). Pricing Management (`/pricing`, `/pricing/promotions`) reads and writes the in-memory `usePricing` store (service prices, VAT, referral bonus, promotions), seeded from `mock.ts`. Audience Marketplace (`/audience-marketplace`, `/audience-marketplace/records/:recordId`, `/audience-marketplace/states`, `/audience-marketplace/states/:stateId/lgas`, `/audience-marketplace/lgas`) reads and writes the in-memory `useAudience` store (state / LGA activation, CSV uploads parsed in the browser). The 37 states and 774 LGAs come from `src/data/nigeria.ts`; record counts live on LGAs and are rolled up per state by `summarizeStates`; a record is "Active" only while its state and LGA are both active. Wallet Management (`/wallets`, `/wallets/transactions/:transactionId`) reads `mockWalletLedger` / `walletStats` directly (read-only); the Wallet Impact card is derived from each transaction's type, status and `previousBalance` in `getWalletImpact`. Finance & Reports (`/finance`, `/finance/reports/:reportId` — `revenue`, `vat`, `wallet-funding`, `referral-bonuses`, `refunds`) is read-only: headline figures come from `financeStats` in `mock.ts`, and each report's activity table is `mockWalletLedger` filtered by that report's `includes` in `src/pages/finance/reports.tsx`. A report's `columns` drive both its table and its client-side CSV export. Ledger charge amounts include VAT; `splitCharge` splits them at `financeStats.vatRate`. The reporting period lives in the `?period=` search param (`useReportPeriod`) and defaults to All Time, because the mock ledger dates are from Sep 2026. Referral Management (`/referrals`, `/referrals/:referralId`) reads `mockReferrals` (read-only). Each referred user is a generated `mockUsers` entry (u-1013 onward). A referral is successful once it has a `bonusTransactionId`, and its bonus status (Pending / Paid / Failed) is derived from that ledger transaction by `getReferralBonus`; unissued bonuses show the currently configured bonus from `usePricing`. Headline referral figures come from `referralProgramStats`, which the dashboard, wallet and finance figures share. Advertisement Management (`/advertisements`, `/advertisements/new`, `/advertisements/:advertisementId`, `/advertisements/:advertisementId/edit`) reads and writes the in-memory `useAdvertisements` store (create / edit / pause / resume / end), seeded from `mockAdvertisements`. Mock statuses are stored, not derived, because the mock dates are in the past; a saved ad becomes Scheduled or Active from its start time (`getScheduleStatus`), and paused / ended ads keep their status on edit. Mock creatives are inline SVGs from `src/data/adCreatives.ts`; uploaded creatives are kept as data URLs until there's an upload endpoint. Ads with no `impressions` show "Tracking data unavailable". Support (`/support` tickets, `/support/tickets/:ticketId`, `/support/articles`, `/support/faqs`, plus `/new` and `/:contentId/edit` under each) reads and writes the in-memory `useSupport` store: ticket replies, internal notes and status / priority changes, and help article / FAQ create, edit, publish, unpublish and delete. Tickets are seeded from `mockSupportTickets` in `mock.ts` and may link a related wallet transaction, campaign or referral; articles and FAQs are seeded from `src/data/helpContent.ts`. Articles and FAQs share one `HelpContent` shape and one list / form (`HelpContentList`, `HelpContentForm`), with wording per kind in `helpContentKinds`. Their bodies are HTML from `WebAppRichTextEditor`; run them through `sanitizeRichText` (`src/utils/richText.ts`) before saving or rendering. Row "⋮" menus use `WebAppActionMenu`. Notifications (`/notifications`, `/notifications/new`, `/notifications/:notificationId`, `/notifications/:notificationId/edit`) reads and writes the in-memory `useNotifications` store, seeded from `mockNotifications`. System notifications (wallet / referral / campaign / account events, sent to one user) are read-only. Admins only create "All Users" announcements, sent now or scheduled; only scheduled ones can be edited or cancelled, and cancelled ones stay in the history. "Related Information" links for tickets and notifications come from `RelatedRecordLink` in `src/pages/shared/`. Compliance (`/compliance` = Flagged Activities, `/compliance/flags/:flagId`, `/compliance/content-reports`, `/compliance/campaigns`, `/compliance/user-activity`, `/compliance/audit-logs`, `/compliance/disclaimers`) reads and writes the in-memory `useCompliance` store, seeded from `src/data/compliance.ts`. Flags move Pending Review → Under Review → Resolved (violation confirmed, with an action) or Dismissed (no violation), and every review action and note appends to the audit log. A User Suspended action also suspends the user in `useUsers`; the campaign-cancel and restrict actions are only recorded, because campaigns and users have no state for them yet. A content report's status is its flag's status, and Campaign Compliance is calculated from each campaign's flags (`getCampaignCompliance`). User activity and disclaimer logs are read-only. `/compliance/flagged-activities` redirects to `/compliance`. Section tab bars use `WebAppTabs`, and the reply / note boxes use `NoteComposer` (`src/pages/shared/`). Settings (`/settings` = General, `/settings/notifications`, `/settings/security`, `/settings/platform`) reads and writes `useSettings`, which, like `useAuth`, is persisted to localStorage. The platform name and logo are shown in the sidebar; the session timeout signs an idle admin out (`useIdleTimeout` in `AdminLayout`); Require Strong Passwords switches the Change Password rule (via the resolver `context`); and turning off admin announcements blocks Create Notification. The default time zone is saved but not yet applied to date formatting, and the system notification toggles are only stored (the backend generates those notifications). Platform Information shows "Not available" until the backend exists.
- Placeholder/TODO: the login page (`/`) validates email and password with `loginSchema`, then calls `authService.login`. In development (`import.meta.env.DEV`) it skips the API and signs in with a fake token. The `/auth/login` path and `LoginResult` shape in `src/api/services/auth.ts`, and the refresh endpoint path in `src/utils/api-utils.ts`, still need real backend values. The page shows the platform name, logo and support email from `useSettings`.
- Every sidebar link now has a page.
- Staying on TypeScript 6 until typescript-eslint supports TypeScript 7. Don't use the deprecated `baseUrl` tsconfig option.
