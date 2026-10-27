CREATE TABLE "PlantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "category" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlantProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlantAnalysis" ADD COLUMN "plantProfileId" TEXT;
CREATE INDEX "PlantProfile_userId_name_idx" ON "PlantProfile"("userId", "name");
CREATE INDEX "PlantAnalysis_plantProfileId_createdAt_idx" ON "PlantAnalysis"("plantProfileId", "createdAt" DESC);
ALTER TABLE "PlantProfile" ADD CONSTRAINT "PlantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlantAnalysis" ADD CONSTRAINT "PlantAnalysis_plantProfileId_fkey" FOREIGN KEY ("plantProfileId") REFERENCES "PlantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
