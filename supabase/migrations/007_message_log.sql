CREATE TABLE message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  coordination_id uuid REFERENCES coordinations(id) ON DELETE SET NULL,
  photo_sent boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE
);

ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_log_read" ON message_log FOR SELECT TO authenticated
  USING (branch_id = get_my_branch_id() OR is_super_admin());
