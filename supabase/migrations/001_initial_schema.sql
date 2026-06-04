-- Branches
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Managers (linked to Supabase auth users)
create table managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text not null,
  branch_id uuid references branches(id) on delete set null,
  is_super_admin boolean default false,
  created_at timestamptz default now()
);

-- Families
create table families (
  family_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  national_id text unique not null,
  address text,
  phone text,
  member_count integer,
  disability_type text,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now()
);

-- Volunteers
create table volunteers (
  volunteer_id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  national_id text unique not null,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now()
);

-- Deliveries
create table deliveries (
  address_id uuid primary key default gen_random_uuid(),
  address text not null,
  door_photo_url text,
  family_id uuid references families(family_id) on delete set null,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now()
);

-- Activity Types (organization-level)
create table activity_types (
  type_id uuid primary key default gen_random_uuid(),
  type_name text not null unique,
  created_at timestamptz default now()
);

-- Activities (branch-level)
create table activities (
  activity_id uuid primary key default gen_random_uuid(),
  type_id uuid references activity_types(type_id) on delete set null,
  date date not null,
  volunteer_id uuid references volunteers(volunteer_id) on delete set null,
  branch_id uuid references branches(id) on delete cascade,
  status text check (status in ('upcoming', 'completed')) default 'upcoming',
  created_at timestamptz default now()
);

-- Row Level Security
alter table branches enable row level security;
alter table managers enable row level security;
alter table families enable row level security;
alter table volunteers enable row level security;
alter table deliveries enable row level security;
alter table activity_types enable row level security;
alter table activities enable row level security;

-- Helper: get current user's branch_id
create or replace function get_my_branch_id()
returns uuid language sql security definer
as $$
  select branch_id from managers where user_id = auth.uid() and not is_super_admin
$$;

-- Helper: is current user super admin
create or replace function is_super_admin()
returns boolean language sql security definer
as $$
  select coalesce((select is_super_admin from managers where user_id = auth.uid()), false)
$$;

-- Branches: readable by all authenticated users
create policy "branches_read" on branches for select to authenticated using (true);
create policy "branches_write_super" on branches for all to authenticated using (is_super_admin());

-- Managers: super admin manages all, managers read their own
create policy "managers_read_own" on managers for select to authenticated using (user_id = auth.uid() or is_super_admin());
create policy "managers_write_super" on managers for all to authenticated using (is_super_admin());

-- Families: scoped to branch
create policy "families_read" on families for select to authenticated using (branch_id = get_my_branch_id() or is_super_admin());
create policy "families_write" on families for all to authenticated using (branch_id = get_my_branch_id() or is_super_admin());

-- Volunteers: scoped to branch
create policy "volunteers_read" on volunteers for select to authenticated using (branch_id = get_my_branch_id() or is_super_admin());
create policy "volunteers_write" on volunteers for all to authenticated using (branch_id = get_my_branch_id() or is_super_admin());

-- Deliveries: scoped to branch
create policy "deliveries_read" on deliveries for select to authenticated using (branch_id = get_my_branch_id() or is_super_admin());
create policy "deliveries_write" on deliveries for all to authenticated using (branch_id = get_my_branch_id() or is_super_admin());

-- Activity Types: readable by all, writable by super admin
create policy "activity_types_read" on activity_types for select to authenticated using (true);
create policy "activity_types_write" on activity_types for all to authenticated using (is_super_admin());

-- Activities: scoped to branch
create policy "activities_read" on activities for select to authenticated using (branch_id = get_my_branch_id() or is_super_admin());
create policy "activities_write" on activities for all to authenticated using (branch_id = get_my_branch_id() or is_super_admin());
