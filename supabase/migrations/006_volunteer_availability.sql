CREATE TABLE volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
  date date NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(volunteer_id, date)
);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_read" ON volunteer_availability FOR SELECT TO authenticated
  USING (branch_id = get_my_branch_id() OR is_super_admin());

CREATE POLICY "availability_write" ON volunteer_availability FOR ALL TO authenticated
  USING (branch_id = get_my_branch_id() OR is_super_admin())
  WITH CHECK (branch_id = get_my_branch_id() OR is_super_admin());
