-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "salaryMax" DOUBLE PRECISION,
ADD COLUMN     "salaryMin" DOUBLE PRECISION,
ADD COLUMN     "skillTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
