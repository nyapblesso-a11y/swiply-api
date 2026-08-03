-- CreateTable
CREATE TABLE "CV" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawFileUrl" TEXT NOT NULL,
    "parsedSkills" TEXT[],
    "parsedExperience" JSONB NOT NULL,
    "parsedEducation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CV_userId_key" ON "CV"("userId");

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
