-- Goals and body snapshot on the user row.
ALTER TABLE "User" ADD COLUMN "waterTargetMl" INTEGER NOT NULL DEFAULT 2500;
ALTER TABLE "User" ADD COLUMN "sleepTargetHours" DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE "User" ADD COLUMN "currentWeightKg" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "startWeightKg" DOUBLE PRECISION;

-- Backfill the snapshot from whatever weigh-ins already exist.
UPDATE "User" u SET
  "currentWeightKg" = latest."weightKg",
  "startWeightKg" = earliest."weightKg"
FROM
  (SELECT DISTINCT ON ("userId") "userId", "weightKg" FROM "DailyMetric"
     WHERE "weightKg" IS NOT NULL ORDER BY "userId", "date" DESC) latest,
  (SELECT DISTINCT ON ("userId") "userId", "weightKg" FROM "DailyMetric"
     WHERE "weightKg" IS NOT NULL ORDER BY "userId", "date" ASC) earliest
WHERE latest."userId" = u."id" AND earliest."userId" = u."id";
