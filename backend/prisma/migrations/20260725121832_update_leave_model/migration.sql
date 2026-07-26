/*
  Warnings:

  - A unique constraint covering the columns `[leaveNumber]` on the table `Leave` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leaveNumber` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "leaveNumber" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Leave_leaveNumber_key" ON "Leave"("leaveNumber");
