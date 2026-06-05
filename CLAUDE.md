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
| **Branch Manager** (`is_super_admin = false`) | Scoped to their branch. Can CRUD families, volunteers, deliveries, activities, coordinations, manager hours, volunteer availability. |
| **Super Admin** (`is_super_admin = true`) | Sees all branches. Can manage branches, managers, activity types. Read-only on most branch data. |

RLS is enforced via two Postgres helper functions:
- `get_my_branch_id()` — returns the manager's branch_id (NULL for super admins)
- `is_super_admin()` — returns boolean

## Database Schema

### Tables

**branches** — `id, name, created_at`

**managers** — `id, user_id (→ auth.users), name, phone, email, branch_id (→ branches), is_super_admin, created_at`

**families** — `family_id, full_name, national_id (unique), address, phone, member_count, disability_type, branch_id, created_at`

**volunteers** — `volunteer_id, name, phone, address, national_id (unique), branch_id, skills text[], created_at`
- `skills` is a `text[]` array (e.g. `['נהיגה', 'בישול']`)

**volunteer_availability** — `id, volunteer_id (→ volunteers), date, branch_id, created_at`
- Unique on `(volunteer_id, date)`
- Managers set available dates for each volunteer

**deliveries** — `address_id, address, door_photo_url, family_id (→ families), branch_id, created_at`
- Door photos stored in Supabase Storage, uploaded via `/api/upload-photo`

**coordinations** — `id, date, scheduled_time (time), address, volunteer_id (→ volunteers), branch_id, created_at`
- Lives under the deliveries page (תיאום tab)
- `scheduled_time` is named that way because `time` is a reserved word in PostgreSQL
- `address` stores the address text copied from the selected delivery address

**message_log** — `id, volunteer_name, phone, address, coordination_id (→ coordinations), photo_sent bool, sent_at, branch_id`
- Written by `/api/send-delivery-messages` (service role, bypasses RLS)
- Readable by authenticated managers (scoped to branch)
- Displayed at the bottom of the תיאום tab

**activity_types** — `type_id, type_name (unique), created_at` — org-level, all managers can manage

**activities** — `activity_id, type_id (→ activity_types), date, branch_id, status ('upcoming'|'completed'), created_at`
- No `volunteer_id` column — volunteer assignments live in `activity_volunteers`

**activity_volunteers** — `activity_id, volunteer_id` (composite PK)
- Many-to-many between activities and volunteers

**manager_hours** — `id, manager_id, branch_id, date, hours, notes, created_at`

### Migrations

All in `supabase/migrations/`. Run manually in Supabase SQL Editor — they are NOT auto-applied:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Base schema + RLS policies |
| `002_activity_types_open_to_managers.sql` | Allow all managers to manage activity types |
| `003_activity_volunteers_junction.sql` | Replaces `volunteer_id` on activities with junction table |
| `004_coordinations.sql` | Coordinations table |
| `005_volunteer_skills.sql` | `ALTER TABLE volunteers ADD COLUMN skills text[] DEFAULT '{}'` |
| `006_volunteer_availability.sql` | Volunteer availability table + RLS |
| `007_message_log.sql` | Message log table + RLS |

## Pages & Components

```
/dashboard                       — home: stats + today's coordinations + assignment alerts
/dashboard/families              — CRUD, Excel import+export (upsert on national_id)
/dashboard/volunteers            — tabbed:
    רשימה                        — CRUD with skills field, Excel import+export
    זמינות                       — set available dates per volunteer (inline date picker per row)
/dashboard/deliveries            — tabbed:
    כתובות                       — address CRUD + map + door photo upload
    תיאום                        — coordination CRUD + message log history
/dashboard/activities            — CRUD, Excel export (no volunteer field — use assignment page)
/dashboard/activity-assignments  — assign volunteers to activities; modal shows skills + availability indicator
/dashboard/activity-types        — CRUD, all managers
/dashboard/manager-hours         — hour logging with Excel export
/dashboard/branches              — super admin only
/dashboard/managers              — super admin only; create via /api/create-manager
```

## API Routes

- `POST /api/create-manager` — creates Supabase auth user + manager record (super admin only)
- `DELETE /api/delete-manager` — deletes manager + auth user
- `POST /api/upload-photo` — uploads door photo to Supabase Storage
- `GET /api/send-delivery-messages` — sends WhatsApp messages to volunteers for today's coordinations via Green API; logs each sent message to `message_log`; protected by `x-cron-secret` header

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
- After insert/update, **build the updated record locally** from known values rather than re-fetching with `.select()` — re-fetching with joins can silently return null due to RLS
- Page-level queries use the mutable query builder pattern: `const q = supabase.from(...).select(...); if (condition) q.eq(...); const { data } = await q`
- Tabbed pages follow the `*TabsClient.tsx` wrapper pattern (see `DeliveriesTabsClient`, `VolunteersTabsClient`) — the wrapper holds tab state and renders child clients
- Excel imports use `xlsx` and upsert on a unique field (`national_id` for families and volunteers)
- All text is Hebrew; the app is RTL
- **Mobile**: address columns hidden on small screens with `hidden md:table-cell`
- `time` is a reserved word in PostgreSQL — use `scheduled_time` for time columns

## Activity Assignment Flow

1. Create activities on `/dashboard/activities` (no volunteer field)
2. Go to `/dashboard/activity-assignments` — click pencil on any activity
3. Modal shows all branch volunteers with their **skills as purple tags** and a **green "זמין ✓"** label if the volunteer has marked availability for that activity's date
4. Check/uncheck volunteers and save — stored in `activity_volunteers` junction table
5. Future: "שיבוץ אוטומטי" button (currently disabled placeholder) will trigger AI-based assignment

## WhatsApp Notifications

`/api/send-delivery-messages` runs daily via cron-job.org. It:
1. Fetches all `coordinations` where `date = today` and `volunteer_id IS NOT NULL`
2. For each, looks up the matching delivery address to get `door_photo_url`
3. Sends via Green API — includes photo if available, otherwise asks volunteer to take one
4. Logs each sent message to `message_log`

Israeli phone format: `0501234567` → `972501234567@c.us` (handled in `formatPhone()`)

Setup: call `https://[vercel-url]/api/send-delivery-messages` daily with header `x-cron-secret: [CRON_SECRET value]`
