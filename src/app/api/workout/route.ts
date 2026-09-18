import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey, todayKey, weekdayOf } from "@/lib/dates";
import { badRequest, withUser } from "@/server/http";

const routineInclude = {
	items: { orderBy: { position: "asc" }, include: { exercise: true } },
} as const;

/**
 * Everything the Workout tab needs for one day: the routine that is on for
 * that day, and every set already ticked off.
 */
export const GET = withUser(async (user, req) => {
	const url = new URL(req.url);
	const date = url.searchParams.get("date") ?? todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const logs = await prisma.setLog.findMany({
		where: { userId: user.id, date },
		orderBy: [{ createdAt: "asc" }],
	});

	// A routine the user actually started that day wins over the schedule,
	// so swapping leg day for a walk survives a reload.
	const startedRoutineId = [...logs].reverse().find((l) => l.routineId)?.routineId ?? null;

	const slot = await prisma.scheduleSlot.findUnique({
		where: { userId_weekday: { userId: user.id, weekday: weekdayOf(date) } },
	});

	const activeId = startedRoutineId ?? slot?.routineId ?? null;
	const routine = activeId
		? await prisma.routine.findFirst({
				where: { id: activeId, userId: user.id },
				include: routineInclude,
			})
		: null;

	// Last time each of today's exercises was loaded — the number you actually
	// want in front of you when deciding what to put on the bar.
	const exerciseIds = (routine?.items ?? []).map((item) => item.exerciseId);
	const previous = exerciseIds.length
		? await prisma.setLog.findMany({
				where: {
					userId: user.id,
					exerciseId: { in: exerciseIds },
					date: { lt: date },
					weightKg: { not: null },
				},
				orderBy: [{ date: "desc" }, { setIndex: "desc" }],
				select: { exerciseId: true, date: true, reps: true, weightKg: true },
			})
		: [];

	const lastPerformance: Record<string, { date: string; reps: number | null; weightKg: number | null }> = {};
	for (const log of previous) {
		if (!log.exerciseId || lastPerformance[log.exerciseId]) continue;
		lastPerformance[log.exerciseId] = {
			date: log.date,
			reps: log.reps,
			weightKg: log.weightKg,
		};
	}

	return NextResponse.json({
		date,
		routine,
		scheduledRoutineId: slot?.routineId ?? null,
		logs,
		lastPerformance,
	});
});
