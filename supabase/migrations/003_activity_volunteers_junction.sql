-- Replace single volunteer_id on activities with a many-to-many junction table

create table activity_volunteers (
  activity_id uuid references activities(activity_id) on delete cascade,
  volunteer_id uuid references volunteers(volunteer_id) on delete cascade,
  primary key (activity_id, volunteer_id)
);

-- Migrate existing single-volunteer data
insert into activity_volunteers (activity_id, volunteer_id)
select activity_id, volunteer_id from activities where volunteer_id is not null;

-- Drop old column
alter table activities drop column volunteer_id;

-- RLS
alter table activity_volunteers enable row level security;

create policy "activity_volunteers_read" on activity_volunteers for select to authenticated
  using (
    exists (
      select 1 from activities a
      where a.activity_id = activity_volunteers.activity_id
        and (a.branch_id = get_my_branch_id() or is_super_admin())
    )
  );

create policy "activity_volunteers_write" on activity_volunteers for all to authenticated
  using (
    exists (
      select 1 from activities a
      where a.activity_id = activity_volunteers.activity_id
        and (a.branch_id = get_my_branch_id() or is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from activities a
      where a.activity_id = activity_volunteers.activity_id
        and (a.branch_id = get_my_branch_id() or is_super_admin())
    )
  );
