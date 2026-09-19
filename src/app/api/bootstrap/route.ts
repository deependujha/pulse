import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { withUser } from "@/server/http";
import { PROFILE_SELECT } from "@/server/profile";
import { seedUser } from "@/server/seed";

/**
 * One round-trip that gives the client everything that rarely changes:
 * profile, library, routines and schedule. Also seeds a brand-new account.
 */
export const GET = withUser(async (user) => {
	await seedUser(user.id);

	const [profile, exercises, routines, slots, foods, careSteps] = await Promise.all([
		prisma.user.findUnique({ where: { id: user.id }, select: PROFILE_SELECT }),
		prisma.exercise.findMany({
			where: { userId: user.id, archived: false },
			orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
		}),
		prisma.routine.findMany({
			where: { userId: user.id, archived: false },
			orderBy: { createdAt: "asc" },
			include: { items: { orderBy: { position: "asc" }, include: { exercise: true } } },
		}),
		prisma.scheduleSlot.findMany({ where: { userId: user.id }, orderBy: { weekday: "asc" } }),
		prisma.food.findMany({
			where: { userId: user.id, archived: false },
			orderBy: [{ favorite: "desc" }, { name: "asc" }],
		}),
		prisma.careStep.findMany({
			where: { userId: user.id, archived: false },
			orderBy: [{ phase: "asc" }, { position: "asc" }],
		}),
	]);

	const schedule = Array.from({ length: 7 }, (_, weekday) => ({
		weekday,
		routineId: slots.find((s) => s.weekday === weekday)?.routineId ?? null,
	}));

	return NextResponse.json({ profile, exercises, routines, schedule, foods, careSteps });
});
