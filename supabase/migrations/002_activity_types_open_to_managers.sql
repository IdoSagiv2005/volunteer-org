-- Allow all authenticated managers (not just super admins) to manage activity types
drop policy if exists "activity_types_write" on activity_types;
create policy "activity_types_write" on activity_types for all to authenticated using (true) with check (true);
