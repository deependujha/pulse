import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { notFound, num, optionalStr, readJson, str, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };
type ItemInput = { exerciseId: string; sets?: number; reps?: string; note?: string };

const routineInclude = {
	items: { orderBy: { position: "asc" }, include: { exercise: true } },
} as const;

export const GET = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const routine = await prisma.routine.findFirst({
		where: { id, userId: user.id },
		include: routineInclude,
	});
	if (!routine) return notFound("Workout not found");
	return NextResponse.json({ routine });
});

export const PATCH = withUser<Ctx>(async (user, req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.routine.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Workout not found");

	const body = await readJson(req);
	const hasItems = Array.isArray(body.items);

	await prisma.$transaction(async (tx) => {
		await tx.routine.update({
			where: { id },
			data: {
				name: "name" in body ? str(body.name, owned.name) || owned.name : undefined,
				focus: "focus" in body ? optionalStr(body.focus) : undefined,
				color: "color" in body ? str(body.color, owned.color) : undefined,
				emoji: "emoji" in body ? str(body.emoji, owned.emoji) : undefined,
				notes: "notes" in body ? optionalStr(body.notes) : undefined,
			},
		});

		if (hasItems) {
			const rawItems = body.items as ItemInput[];
			const exerciseIds = rawItems.map((i) => str(i?.exerciseId)).filter(Boolean);
			const ownedExercises = await tx.exercise.findMany({
				where: { id: { in: exerciseIds }, userId: user.id },
				select: { id: true },
			});
			const ownedIds = new Set(ownedExercises.map((e) => e.id));

			// Items are positional, so a full replace is simpler and cheaper
			// than diffing — there are only ever a handful of them.
			await tx.routineItem.deleteMany({ where: { routineId: id } });
			const create = rawItems.flatMap((item, position) => {
				const exerciseId = str(item?.exerciseId);
				if (!ownedIds.has(exerciseId)) return [];
				return [
					{
						routineId: id,
						exerciseId,
						position,
						sets: Math.max(1, Math.round(num(item?.sets, 3))),
						reps: str(item?.reps, "8-12") || "8-12",
						note: optionalStr(item?.note),
					},
				];
			});
			if (create.length > 0) await tx.routineItem.createMany({ data: create });
		}
	});

	const routine = await prisma.routine.findUnique({ where: { id }, include: routineInclude });
	return NextResponse.json({ routine });
});

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.routine.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Workout not found");

	await prisma.routine.update({ where: { id }, data: { archived: true } });
	await prisma.scheduleSlot.updateMany({
		where: { userId: user.id, routineId: id },
		data: { routineId: null },
	});
	return NextResponse.json({ ok: true });
});
