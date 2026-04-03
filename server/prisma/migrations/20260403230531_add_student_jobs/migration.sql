-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('NUDIM', 'TRAZIM');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('UGOSTITELJSTVO', 'TRGOVINA', 'ADMINISTRACIJA', 'IT', 'TUTORING', 'DOSTAVA', 'PROMOCIJA', 'FIZICKI_RAD', 'OSTALO');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('PO_SATU', 'PO_DANU', 'PO_MJESECU', 'DOGOVOR');

-- CreateTable
CREATE TABLE "StudentJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "category" "JobCategory" NOT NULL,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "salary" DOUBLE PRECISION,
    "salaryPeriod" "SalaryPeriod",
    "hours" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentJob" ADD CONSTRAINT "StudentJob_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
