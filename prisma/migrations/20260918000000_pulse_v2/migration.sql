-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calorieTarget" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "goalWeightKg" DOUBLE PRECISION,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "proteinTarget" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "seeded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL DEFAULT 'Other',
    "youtubeUrl" TEXT,
    "imageUrl" TEXT,
    "gifUrl" TEXT,
    "notes" TEXT,
    "defaultSets" INTEGER NOT NULL DEFAULT 3,
    "defaultReps" TEXT NOT NULL DEFAULT '8-12',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "focus" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "emoji" TEXT NOT NULL DEFAULT '🏋️',
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineItem" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '8-12',
    "restSec" INTEGER,
    "note" TEXT,

    CONSTRAINT "RoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "routineId" TEXT,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "routineId" TEXT,
    "exerciseId" TEXT,
    "exerciseName" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "reps" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🍽️',
    "servingLabel" TEXT NOT NULL DEFAULT '1 serving',
    "calories" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "foodId" TEXT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🍽️',
    "meal" TEXT NOT NULL DEFAULT 'snack',
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareStep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "product" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'AM',
    "emoji" TEXT NOT NULL DEFAULT '🧴',
    "frequency" TEXT NOT NULL DEFAULT 'EVERY_DAY',
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "waterMl" INTEGER NOT NULL DEFAULT 0,
    "sleepHours" DOUBLE PRECISION,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_userId_archived_idx" ON "Exercise"("userId", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_userId_name_key" ON "Exercise"("userId", "name");

-- CreateIndex
CREATE INDEX "Routine_userId_archived_idx" ON "Routine"("userId", "archived");

-- CreateIndex
CREATE INDEX "RoutineItem_routineId_position_idx" ON "RoutineItem"("routineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_userId_weekday_key" ON "ScheduleSlot"("userId", "weekday");

-- CreateIndex
CREATE INDEX "SetLog_userId_date_idx" ON "SetLog"("userId", "date");

-- CreateIndex
CREATE INDEX "SetLog_userId_exerciseId_idx" ON "SetLog"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SetLog_userId_date_exerciseId_setIndex_key" ON "SetLog"("userId", "date", "exerciseId", "setIndex");

-- CreateIndex
CREATE INDEX "Food_userId_archived_idx" ON "Food"("userId", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "Food_userId_name_key" ON "Food"("userId", "name");

-- CreateIndex
CREATE INDEX "MealEntry_userId_date_idx" ON "MealEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "CareStep_userId_phase_archived_idx" ON "CareStep"("userId", "phase", "archived");

-- CreateIndex
CREATE INDEX "CareLog_userId_date_idx" ON "CareLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CareLog_userId_date_stepId_key" ON "CareLog"("userId", "date", "stepId");

-- CreateIndex
CREATE INDEX "DailyMetric_userId_date_idx" ON "DailyMetric"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_userId_date_key" ON "DailyMetric"("userId", "date");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineItem" ADD CONSTRAINT "RoutineItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareStep" ADD CONSTRAINT "CareStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CareStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
