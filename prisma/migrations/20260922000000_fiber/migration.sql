-- Fiber: a target on the user row and a per-serving value on library items and
-- logged meals. Additive only — existing rows pick up the defaults.
ALTER TABLE "User" ADD COLUMN "fiberTargetG" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "Food" ADD COLUMN "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MealEntry" ADD COLUMN "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0;
