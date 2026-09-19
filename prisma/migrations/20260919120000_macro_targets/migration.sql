-- Carb and fat targets, so every macro bar has something to fill towards.
ALTER TABLE "User" ADD COLUMN "carbsTargetG" INTEGER NOT NULL DEFAULT 220;
ALTER TABLE "User" ADD COLUMN "fatTargetG" INTEGER NOT NULL DEFAULT 60;
