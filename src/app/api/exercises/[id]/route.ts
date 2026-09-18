import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { notFound, num, optionalStr, readJson, str, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withUser<Ctx>(async (user, req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.exercise.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Exercise not found");

	const body = await readJson(req);
	const exercise = await prisma.exercise.update({
		where: { id },
		data: {
			name: "name" in body ? str(body.name, owned.name) || owned.name : undefined,
			muscleGroup: "muscleGroup" in body ? str(body.muscleGroup, "Other") : undefined,
			youtubeUrl: "youtubeUrl" in body ? optionalStr(body.youtubeUrl) : undefined,
			imageUrl: "imageUrl" in body ? optionalStr(body.imageUrl) : undefined,
			gifUrl: "gifUrl" in body ? optionalStr(body.gifUrl) : undefined,
			notes: "notes" in body ? optionalStr(body.notes) : undefined,
			defaultSets:
				"defaultSets" in body
					? Math.max(1, Math.round(num(body.defaultSets, owned.defaultSets)))
					: undefined,
			defaultReps: "defaultReps" in body ? str(body.defaultReps, owned.defaultReps) : undefined,
		},
	});
	return NextResponse.json({ exercise });
});

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.exercise.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Exercise not found");

	// Archive rather than delete: past set logs should keep pointing somewhere.
	await prisma.exercise.update({ where: { id }, data: { archived: true } });
	await prisma.routineItem.deleteMany({ where: { exerciseId: id } });
	return NextResponse.json({ ok: true });
});
