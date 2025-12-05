-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('aero', 'moto');

-- AlterTable
ALTER TABLE "PrintRequest" ADD COLUMN "workOrderType" "WorkOrderType";

