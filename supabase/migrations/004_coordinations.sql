CREATE TABLE coordinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  address text NOT NULL,
  volunteer_id uuid REFERENCES volunteers(volunteer_id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coordinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coordinations_read" ON coordinations FOR SELECT TO authenticated
  USING (branch_id = get_my_branch_id() OR is_super_admin());

CREATE POLICY "coordinations_write" ON coordinations FOR ALL TO authenticated
  USING (branch_id = get_my_branch_id() OR is_super_admin())
  WITH CHECK (branch_id = get_my_branch_id() OR is_super_admin());
