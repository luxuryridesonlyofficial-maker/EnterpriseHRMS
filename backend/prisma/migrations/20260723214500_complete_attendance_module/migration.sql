-- Add employee-level shift assignment for reliable attendance calculations.
ALTER TABLE "Employee" ADD COLUMN "shiftId" TEXT;

-- Store derived net working time and operational audit timestamps.
ALTER TABLE "Attendance"
  ADD COLUMN "netWorkingMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AttendanceBreak"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Attendance dates represent a business calendar day, not an arbitrary timestamp.
ALTER TABLE "Attendance"
  ALTER COLUMN "date" TYPE DATE USING "date"::date;

-- Existing duplicate records must be reconciled before enforcing the invariant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Attendance"
    GROUP BY "employeeId", "date"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot apply attendance uniqueness constraint: duplicate employee/date records exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX "Attendance_employeeId_date_key"
  ON "Attendance"("employeeId", "date");

CREATE INDEX "Employee_shiftId_idx" ON "Employee"("shiftId");
CREATE INDEX "Attendance_employeeId_status_idx"
  ON "Attendance"("employeeId", "status");
CREATE INDEX "Attendance_date_status_idx"
  ON "Attendance"("date", "status");
CREATE INDEX "AttendanceBreak_attendanceId_breakIn_idx"
  ON "AttendanceBreak"("attendanceId", "breakIn");

ALTER TABLE "Employee"
  ADD CONSTRAINT "Employee_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "Shift"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttendanceBreak"
  DROP CONSTRAINT "AttendanceBreak_attendanceId_fkey";

ALTER TABLE "AttendanceBreak"
  ADD CONSTRAINT "AttendanceBreak_attendanceId_fkey"
  FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
