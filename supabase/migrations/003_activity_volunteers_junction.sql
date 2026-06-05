-- Step 1: Create junction table
CREATE TABLE activity_volunteers (
  activity_id uuid REFERENCES activities(activity_id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, volunteer_id)
);

-- Step 2: Migrate existing single-volunteer data and drop old column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'volunteer_id'
  ) THEN
    INSERT INTO activity_volunteers (activity_id, volunteer_id)
    SELECT activity_id, volunteer_id FROM activities WHERE volunteer_id IS NOT NULL;
    ALTER TABLE activities DROP COLUMN volunteer_id;
  END IF;
END $$;

-- Step 3: Enable RLS
ALTER TABLE activity_volunteers ENABLE ROW LEVEL SECURITY;

-- Step 4: Policies
CREATE POLICY "activity_volunteers_read" ON activity_volunteers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.activity_id = activity_volunteers.activity_id
        AND (a.branch_id = get_my_branch_id() OR is_super_admin())
    )
  );

CREATE POLICY "activity_volunteers_write" ON activity_volunteers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.activity_id = activity_volunteers.activity_id
        AND (a.branch_id = get_my_branch_id() OR is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.activity_id = activity_volunteers.activity_id
        AND (a.branch_id = get_my_branch_id() OR is_super_admin())
    )
  );
