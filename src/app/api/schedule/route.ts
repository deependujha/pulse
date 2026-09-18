import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, readJson, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const slots = await prisma.scheduleSlot.findMany({
		where: { userId: user.id },
		orderBy: { weekday: "asc" },
	});

	// Always return all seven days so the client never has to fill gaps.
	const schedule = Array.from({ length: 7 }, (_, weekday) => ({
		weekday,
		routineId: slots.find((s) => s.weekday === weekday)?.routineId ?? null,
	}));
	return NextResponse.json({ schedule });
});

export const PUT = withUser(async (user, req) => {
	const body = await readJson(req);
	const weekday = Number(body.weekday);
	if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
		return badRequest("weekday must be 0-6");
	}

	const routineId = typeof body.routineId === "string" && body.routineId ? body.routineId : null;
	if (routineId) {
		const owned = await prisma.routine.findFirst({
			where: { id: routineId, userId: user.id },
			select: { id: true },
		});
		if (!owned) return badRequest("Unknown workout");
	}

	const slot = await prisma.scheduleSlot.upsert({
		where: { userId_weekday: { userId: user.id, weekday } },
		update: { routineId },
		create: { userId: user.id, weekday, routineId },
	});
	return NextResponse.json({ slot });
});
