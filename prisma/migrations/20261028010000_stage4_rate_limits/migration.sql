CREATE TABLE "ApiRateLimitWindow" (
    "key" TEXT NOT NULL,
    "bucket" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApiRateLimitWindow_pkey" PRIMARY KEY ("key", "bucket")
);

CREATE INDEX "ApiRateLimitWindow_updatedAt_idx" ON "ApiRateLimitWindow"("updatedAt");
