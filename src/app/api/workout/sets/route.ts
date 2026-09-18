import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey } from "@/lib/dates";
import { badRequest, notFound, num, optionalNum, readJson, str, withUser } from "@/server/http";

/** Tick a set off (or update its reps/weight). Idempotent per (date, exercise, setIndex). */
export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const date = str(body.date);
	const exerciseId = str(body.exerciseId);
	const setIndex = Math.round(num(body.setIndex, -1));

	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");
	if (!exerciseId) return badRequest("exerciseId is required");
	if (setIndex < 0) return badRequest("setIndex is required");

	const exercise = await prisma.exercise.findFirst({
		where: { id: exerciseId, userId: user.id },
		select: { id: true, name: true },
	});
	if (!exercise) return notFound("Exercise not found");

	const routineId = str(body.routineId) || null;
	if (routineId) {
		const owned = await prisma.routine.findFirst({
			where: { id: routineId, userId: user.id },
			select: { id: true },
		});
		if (!owned) return badRequest("Unknown workout");
	}

	const reps = optionalNum(body.reps);
	const weightKg = optionalNum(body.weightKg);

	const log = await prisma.setLog.upsert({
		where: {
			userId_date_exerciseId_setIndex: { userId: user.id, date, exerciseId, setIndex },
		},
		update: { reps, weightKg, routineId },
		create: {
			userId: user.id,
			date,
			exerciseId,
			exerciseName: exercise.name,
			setIndex,
			reps,
			weightKg,
			routineId,
		},
	});

	return NextResponse.json({ log });
});

/** Un-tick a set. */
export const DELETE = withUser(async (user, req) => {
	const url = new URL(req.url);
	const date = url.searchParams.get("date") ?? "";
	const exerciseId = url.searchParams.get("exerciseId") ?? "";
	const setIndex = Number(url.searchParams.get("setIndex"));

	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");
	if (!exerciseId || !Number.isInteger(setIndex)) return badRequest("exerciseId and setIndex are required");

	await prisma.setLog.deleteMany({
		where: { userId: user.id, date, exerciseId, setIndex },
	});
	return NextResponse.json({ ok: true });
});
