import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, num, optionalStr, readJson, str, withUser } from "@/server/http";

const routineInclude = {
	items: {
		orderBy: { position: "asc" },
		include: { exercise: true },
	},
} as const;

export const GET = withUser(async (user) => {
	const routines = await prisma.routine.findMany({
		where: { userId: user.id, archived: false },
		orderBy: { createdAt: "asc" },
		include: routineInclude,
	});
	return NextResponse.json({ routines });
});

type ItemInput = { exerciseId: string; sets?: number; reps?: string; note?: string };

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const name = str(body.name);
	if (!name) return badRequest("Give the workout a name");

	const rawItems = Array.isArray(body.items) ? (body.items as ItemInput[]) : [];
	const exerciseIds = rawItems.map((i) => str(i?.exerciseId)).filter(Boolean);
	const owned = await prisma.exercise.findMany({
		where: { id: { in: exerciseIds }, userId: user.id },
		select: { id: true },
	});
	const ownedIds = new Set(owned.map((e) => e.id));

	const routine = await prisma.routine.create({
		data: {
			userId: user.id,
			name,
			focus: optionalStr(body.focus),
			color: str(body.color, "#6366f1") || "#6366f1",
			emoji: str(body.emoji, "🏋️") || "🏋️",
			notes: optionalStr(body.notes),
			items: {
				create: rawItems.flatMap((item, position) => {
					const exerciseId = str(item?.exerciseId);
					if (!ownedIds.has(exerciseId)) return [];
					return [
						{
							exerciseId,
							position,
							sets: Math.max(1, Math.round(num(item?.sets, 3))),
							reps: str(item?.reps, "8-12") || "8-12",
							note: optionalStr(item?.note),
						},
					];
				}),
			},
		},
		include: routineInclude,
	});

	return NextResponse.json({ routine }, { status: 201 });
});
