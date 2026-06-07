ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('שטח', 'חונכות', 'עונתיים'));
