import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { addDays, lastNDays, todayKey } from "@/lib/dates";
import { isStepDue } from "@/lib/care";
import { withUser } from "@/server/http";

export type InsightDay = {
	date: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	meals: number;
	sets: number;
	volumeKg: number;
	careDone: number;
	careTotal: number;
	weightKg: number | null;
};

/**
 * The whole Insights tab in one query batch: a day-by-day series plus the
 * headline numbers derived from it.
 */
export const GET = withUser(async (user, req) => {
	const url = new URL(req.url);
	const requested = Number(url.searchParams.get("days") ?? 30);
	const days = Number.isFinite(requested) ? Math.min(365, Math.max(7, Math.round(requested))) : 30;

	const end = todayKey();
	const start = addDays(end, -(days - 1));
	const range = { gte: start, lte: end };

	const [profile, meals, sets, careLogs, careSteps, metrics] = await Promise.all([
		prisma.user.findUnique({
			where: { id: user.id },
			select: {
				calorieTarget: true,
				proteinTarget: true,
				waterTargetMl: true,
				sleepTargetHours: true,
				heightCm: true,
				currentWeightKg: true,
				startWeightKg: true,
				goalWeightKg: true,
			},
		}),
		prisma.mealEntry.findMany({
			where: { userId: user.id, date: range },
			select: { date: true, calories: true, proteinG: true, carbsG: true, fatG: true, name: true },
		}),
		prisma.setLog.findMany({
			where: { userId: user.id, date: range },
			select: { date: true, reps: true, weightKg: true, exerciseName: true },
		}),
		prisma.careLog.findMany({
			where: { userId: user.id, date: range },
			select: { date: true, stepId: true },
		}),
		prisma.careStep.findMany({
			where: { userId: user.id, archived: false },
			select: { id: true, frequency: true, weekdays: true },
		}),
		prisma.dailyMetric.findMany({
			where: { userId: user.id, date: range },
			select: { date: true, weightKg: true, waterMl: true },
		}),
	]);

	const calorieTarget = profile?.calorieTarget ?? 2000;
	const proteinTarget = profile?.proteinTarget ?? 120;

	const blank = (date: string): InsightDay => ({
		date,
		calories: 0,
		proteinG: 0,
		carbsG: 0,
		fatG: 0,
		meals: 0,
		sets: 0,
		volumeKg: 0,
		careDone: 0,
		careTotal: 0,
		weightKg: null,
	});

	const byDate = new Map<string, InsightDay>(lastNDays(days, end).map((d) => [d, blank(d)]));

	for (const m of meals) {
		const day = byDate.get(m.date);
		if (!day) continue;
		day.calories += m.calories;
		day.proteinG += m.proteinG;
		day.carbsG += m.carbsG;
		day.fatG += m.fatG;
		day.meals += 1;
	}

	for (const s of sets) {
		const day = byDate.get(s.date);
		if (!day) continue;
		day.sets += 1;
		day.volumeKg += (s.reps ?? 0) * (s.weightKg ?? 0);
	}

	const doneByDate = new Map<string, Set<string>>();
	for (const log of careLogs) {
		if (!doneByDate.has(log.date)) doneByDate.set(log.date, new Set());
		doneByDate.get(log.date)!.add(log.stepId);
	}

	for (const [date, day] of byDate) {
		const due = careSteps.filter((step) => isStepDue(step, date));
		day.careTotal = due.length;
		const done = doneByDate.get(date);
		day.careDone = done ? due.filter((step) => done.has(step.id)).length : 0;
	}

	for (const metric of metrics) {
		const day = byDate.get(metric.date);
		if (day) day.weightKg = metric.weightKg;
	}

	const series = [...byDate.values()].map((d) => ({
		...d,
		proteinG: round1(d.proteinG),
		carbsG: round1(d.carbsG),
		fatG: round1(d.fatG),
		volumeKg: Math.round(d.volumeKg),
	}));

	// Only days with something logged count towards averages — an unlogged
	// day is missing data, not a zero-calorie day.
	const loggedDays = series.filter((d) => d.meals > 0);
	const totalCalories = loggedDays.reduce((sum, d) => sum + d.calories, 0);
	const avgCalories = loggedDays.length ? Math.round(totalCalories / loggedDays.length) : 0;
	const avgProtein = loggedDays.length
		? round1(loggedDays.reduce((sum, d) => sum + d.proteinG, 0) / loggedDays.length)
		: 0;

	let running = 0;
	const deficitSeries = series.map((d) => {
		if (d.meals > 0) running += calorieTarget - d.calories;
		return { date: d.date, cumulativeDeficit: running, dailyDeficit: d.meals > 0 ? calorieTarget - d.calories : 0 };
	});

	const weights = series.filter((d) => d.weightKg !== null);
	const workoutDays = series.filter((d) => d.sets > 0).length;

	// Most-eaten foods over the window — useful for spotting the real drivers.
	const foodCounts = new Map<string, { name: string; count: number; calories: number }>();
	for (const m of meals) {
		const prev = foodCounts.get(m.name) ?? { name: m.name, count: 0, calories: 0 };
		prev.count += 1;
		prev.calories += m.calories;
		foodCounts.set(m.name, prev);
	}
	const topFoods = [...foodCounts.values()].sort((a, b) => b.calories - a.calories).slice(0, 6);

	const exerciseCounts = new Map<string, number>();
	for (const s of sets) {
		exerciseCounts.set(s.exerciseName, (exerciseCounts.get(s.exerciseName) ?? 0) + 1);
	}
	const topExercises = [...exerciseCounts.entries()]
		.map(([name, setsDone]) => ({ name, sets: setsDone }))
		.sort((a, b) => b.sets - a.sets)
		.slice(0, 6);

	return NextResponse.json({
		days,
		calorieTarget,
		proteinTarget,
		waterTargetMl: profile?.waterTargetMl ?? 2500,
		sleepTargetHours: profile?.sleepTargetHours ?? 8,
		heightCm: profile?.heightCm ?? null,
		// Lifetime figures from the profile. `summary.startWeightKg` and
		// `summary.currentWeightKg` are the ends of the selected range instead.
		currentWeightKg: profile?.currentWeightKg ?? null,
		startWeightKg: profile?.startWeightKg ?? null,
		goalWeightKg: profile?.goalWeightKg ?? null,
		series,
		deficitSeries,
		summary: {
			avgCalories,
			avgProtein,
			totalCalories,
			loggedDays: loggedDays.length,
			workoutDays,
			totalSets: series.reduce((sum, d) => sum + d.sets, 0),
			totalVolumeKg: series.reduce((sum, d) => sum + d.volumeKg, 0),
			cumulativeDeficit: running,
			estimatedFatKg: round2(running / 7700),
			careAdherence: adherence(series),
			startWeightKg: weights[0]?.weightKg ?? null,
			currentWeightKg: weights[weights.length - 1]?.weightKg ?? null,
			workoutStreak: streak(series, (d) => d.sets > 0),
			careStreak: streak(series, (d) => d.careTotal > 0 && d.careDone >= d.careTotal),
			logStreak: streak(series, (d) => d.meals > 0),
		},
		topFoods,
		topExercises,
	});
});

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

const adherence = (series: InsightDay[]): number => {
	const total = series.reduce((sum, d) => sum + d.careTotal, 0);
	const done = series.reduce((sum, d) => sum + d.careDone, 0);
	return total === 0 ? 0 : Math.round((done / total) * 100);
};

/** Consecutive qualifying days counting back from the most recent day. */
const streak = (series: InsightDay[], qualifies: (d: InsightDay) => boolean): number => {
	let count = 0;
	for (let i = series.length - 1; i >= 0; i--) {
		if (!qualifies(series[i])) {
			// Today not being done yet shouldn't wipe a streak mid-morning.
			if (i === series.length - 1) continue;
			break;
		}
		count += 1;
	}
	return count;
};
