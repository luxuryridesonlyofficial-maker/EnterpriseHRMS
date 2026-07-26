-- A branch may define a shift name only once.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Shift"
    GROUP BY "branchId", "name"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot apply shift uniqueness constraint: duplicate branch/name records exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX "Shift_branchId_name_key"
  ON "Shift"("branchId", "name");
