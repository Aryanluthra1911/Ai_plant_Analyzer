CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlantAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantName" TEXT,
    "plantCategory" TEXT,
    "symptomDescription" TEXT,
    "imageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlantAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "PlantAnalysis_imageKey_key" ON "PlantAnalysis"("imageKey");
CREATE INDEX "PlantAnalysis_userId_createdAt_idx" ON "PlantAnalysis"("userId", "createdAt" DESC);
CREATE INDEX "PlantAnalysis_userId_status_idx" ON "PlantAnalysis"("userId", "status");

ALTER TABLE "PlantAnalysis" ADD CONSTRAINT "PlantAnalysis_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
