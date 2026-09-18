import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, num, optionalStr, readJson, str, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const exercises = await prisma.exercise.findMany({
		where: { userId: user.id, archived: false },
		orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
	});
	return NextResponse.json({ exercises });
});

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const name = str(body.name);
	if (!name) return badRequest("Give the exercise a name");

	const existing = await prisma.exercise.findUnique({
		where: { userId_name: { userId: user.id, name } },
	});
	if (existing && !existing.archived) {
		return badRequest(`"${name}" is already in your library`);
	}

	const data = {
		muscleGroup: str(body.muscleGroup, "Other") || "Other",
		youtubeUrl: optionalStr(body.youtubeUrl),
		imageUrl: optionalStr(body.imageUrl),
		gifUrl: optionalStr(body.gifUrl),
		notes: optionalStr(body.notes),
		defaultSets: Math.max(1, Math.round(num(body.defaultSets, 3))),
		defaultReps: str(body.defaultReps, "8-12") || "8-12",
		archived: false,
	};

	// Re-activating an archived exercise keeps its history intact.
	const exercise = existing
		? await prisma.exercise.update({ where: { id: existing.id }, data })
		: await prisma.exercise.create({ data: { userId: user.id, name, ...data } });

	return NextResponse.json({ exercise }, { status: 201 });
});
