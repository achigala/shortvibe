# Shortvibe Project Management — Claude Context

## Stack
- Next.js 16 App Router, TypeScript, Tailwind v4, Prisma + PostgreSQL (Supabase), NextAuth v4
- Deploy: Vercel (auto-deploy on push to `main`)

## Route Checklist — REQUIRED for every new route
Every new page under `app/` MUST have all three files:
1. `page.tsx` — server component, fetch data with Prisma, pass serialized props to client
2. `layout.tsx` — MUST wrap DashboardLayout (see pattern below)
3. `loading.tsx` — skeleton that matches the page layout (use `animate-pulse`)

**layout.tsx pattern** (copy exactly for every new route):
```tsx
import DashboardLayout from "../dashboard/layout"
export default function XxxLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

Missing `layout.tsx` = **navbar disappears** on that page.

## Design System — use `sv-*` classes, NOT inline Tailwind equivalents

| Use this | NOT this |
|---|---|
| `sv-card-hover` | `shadow-sm` alone on cards |
| `sv-icon-box sv-icon-{color}` | `w-10 h-10 rounded-xl bg-purple-100 text-purple-600` |
| `sv-badge sv-badge-{status}` | `px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700` |
| `sv-section-title` | `text-2xl font-bold text-gray-900 flex items-center gap-2` |
| `sv-avatar` / `sv-avatar-sm` | `w-10 h-10 rounded-full bg-purple-100 text-purple-700` |
| `sv-btn-purple px-4 py-2 text-sm` | `sv-btn-purple` alone (no padding = broken button) |

Available badge variants: `sv-badge-waiting`, `sv-badge-inprogress`, `sv-badge-review`, `sv-badge-done`, `sv-badge-closed`, `sv-badge-overdue`, `sv-badge-urgent`, `sv-badge-new`

Available icon colors: `sv-icon-blue`, `sv-icon-purple`, `sv-icon-green`, `sv-icon-orange`, `sv-icon-pink`, `sv-icon-red`, `sv-icon-yellow`

## Optimistic Updates Pattern
Always save previous state before mutating, check `res.ok`, rollback on failure:
```tsx
const prev = localState
setLocalState(newValue)
const res = await fetch(...)
if (!res.ok) setLocalState(prev)
```
For approval/financial actions: wait for `res.ok` THEN update state (safer).

## Data Fetching
- All fetching in server components via `await prisma.*`
- Dates must be serialized: `.toISOString()` before passing to client components
- No `router.refresh()` — use optimistic updates instead (except `handleCompleteProject`)

## Build & Deploy
- `npm run build` — runs `prisma generate` then `next build`; always run before pushing
- Push to `main` → Vercel auto-deploys production
- Check deployment: `vercel ls`

## DB
- Production: PostgreSQL on Supabase
- Local dev: `dev.db` (SQLite, gitignored)
- Uses `prisma db push` (not `prisma migrate`) — no migration files needed
