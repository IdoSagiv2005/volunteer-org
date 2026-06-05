@AGENTS.md

# volunteer-org — מאירים

Volunteer organization management app for a nonprofit ("מאירים") operating across multiple branches in Israel. Hebrew RTL UI throughout.

## Stack

- **Next.js** (App Router, server components by default)
- **Supabase** — auth, Postgres database, file storage (door photos)
- **Tailwind CSS**
- **lucide-react** for icons
- **xlsx** for Excel import/export

Deployed on **Vercel**. External cron via **cron-job.org**.

## User Roles

| Role | Description |
|------|-------------|
| **Branch Manager** (`is_super_admin = false`) | Scoped to their branch. Can CRUD families, volunteers, deliveries, activities, coordinations, manager hours. |
| **Super Admin** (`is_super_admin = true`) | Sees all branches. Can manage branches, managers, activity types. Read-only on most branch data. |

RLS is enforced via two Postgres helper functions:
- `get_my_branch_id()` — returns the manager's branch_id (NULL for super admins)
- `is_super_admin()` — returns boolean

## Database Schema

### Tables

**branches** — `id, name, created_at`

**managers** — `id, user_id (→ auth.users), name, phone, email, branch_id (→ branches), is_super_admin, created_at`

**families** — `family_id, full_name, national_id (unique), address, phone, member_count, disability_type, branch_id, created_at`

**volunteers** — `volunteer_id, name, phone, address, national_id (unique), branch_id, created_at`

**deliveries** — `address_id, address, door_photo_url, family_id (→ families), branch_id, created_at`
- Door photos stored in Supabase Storage, uploaded via `/api/upload-photo`

**activity_types** — `type_id, type_name (unique), created_at` — org-level, all managers can manage

**activities** — `activity_id, type_id (→ activity_types), date, branch_id, status ('upcoming'|'completed'), created_at`
- Volunteer assignments are in the junction table below (NOT a direct FK on this table)

**activity_volunteers** — `activity_id, volunteer_id` (composite PK)
- Many-to-many between activities and volunteers
- ⚠️ Requires migration `003_activity_volunteers_junction.sql` to be run in Supabase

**coordinations** — `id, date, scheduled_time (time), address, volunteer_id (→ volunteers), branch_id, created_at`
- Lives under the deliveries page (תיאום tab)
- `scheduled_time` column is named that way because `time` is a reserved word in PostgreSQL
- ⚠️ Requires migration `004_coordinations.sql` to be run in Supabase

**manager_hours** — `id, manager_id, branch_id, date, hours, notes, created_at`

### Migrations

All migrations are in `supabase/migrations/`. They are NOT auto-applied — run manually in Supabase SQL Editor:
- `001_initial_schema.sql` — base schema + RLS
- `002_activity_types_open_to_managers.sql` — allow all managers to manage activity types
- `003_activity_volunteers_junction.sql` — replaces `volunteer_id` on activities with junction table
- `004_coordinations.sql` — coordinations table

## Pages & Components

```
/dashboard                    — home: stats + today's coordinations + assignment alerts
/dashboard/families           — CRUD, Excel import (upsert on national_id)
/dashboard/volunteers         — CRUD, Excel import (upsert on national_id)
/dashboard/deliveries         — tabbed: כתובות (addresses + map + photos) | תיאום (coordinations)
/dashboard/activities         — CRUD, no volunteer field (assignments handled separately)
/dashboard/activity-assignments — assign volunteers to activities; disabled AI button placeholder
/dashboard/activity-types     — CRUD, all managers
/dashboard/manager-hours      — hour logging with Excel export
/dashboard/branches           — super admin only
/dashboard/managers           — super admin only; create via /api/create-manager
```

## API Routes

- `POST /api/create-manager` — creates Supabase auth user + manager record (super admin only)
- `DELETE /api/delete-manager` — deletes manager + auth user
- `POST /api/upload-photo` — uploads door photo to Supabase Storage
- `GET /api/send-delivery-messages` — sends WhatsApp messages to volunteers for today's coordinations via Green API; protected by `x-cron-secret` header

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       — used by API routes that bypass RLS
GREEN_API_INSTANCE_ID           — WhatsApp messaging (green-api.com)
GREEN_API_TOKEN
CRON_SECRET                     — shared secret between cron-job.org and /api/send-delivery-messages
```

## Key Conventions

- **Server components** fetch data and pass it as props to `*Client.tsx` client components
- **Client components** manage local state with `useState(initial)` — optimistic updates after mutations
- After insert/update, build the updated record locally from known data rather than re-fetching with `.select()`, which can silently return null due to RLS
- Page-level queries use the mutable query builder pattern: `const q = supabase.from(...).select(...); if (condition) q.eq(...); const { data } = await q`
- Excel imports use `xlsx` and upsert on a unique field (`national_id` for families and volunteers)
- All text is Hebrew; the app is RTL

## WhatsApp Notifications

`/api/send-delivery-messages` runs daily via cron-job.org. It:
1. Fetches all `coordinations` where `date = today` and `volunteer_id IS NOT NULL`
2. For each, looks up the matching delivery address to get `door_photo_url`
3. Sends via Green API: includes the photo if available, otherwise asks the volunteer to take one

Israeli phone format: `0501234567` → `972501234567@c.us` (handled in `formatPhone()`)
