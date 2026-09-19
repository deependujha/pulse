import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, bool, num, readJson, str, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const items = await prisma.libraryItem.findMany({
		where: { userId: user.id, archived: false },
		orderBy: [{ favorite: "desc" }, { name: "asc" }],
	});
	return NextResponse.json({ items });
});

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const name = str(body.name);
	if (!name) return badRequest("Give it a name");

	if (num(body.calories, -1) < 0) {
		return badRequest("Calories must be a positive number");
	}
	const calories = Math.round(num(body.calories, 0));

	const data = {
		emoji: str(body.emoji, "🍽️") || "🍽️",
		servingLabel: str(body.servingLabel, "1 serving") || "1 serving",
		calories,
		proteinG: Math.max(0, num(body.proteinG, 0)),
		carbsG: Math.max(0, num(body.carbsG, 0)),
		fatG: Math.max(0, num(body.fatG, 0)),
		favorite: bool(body.favorite),
		archived: false,
	};

	// Re-adding something previously archived revives that row rather than
	// colliding with it on the [userId, name] unique constraint.
	const existing = await prisma.libraryItem.findUnique({
		where: { userId_name: { userId: user.id, name } },
	});
	if (existing && !existing.archived) return badRequest(`"${name}" is already in your library`);

	const item = existing
		? await prisma.libraryItem.update({ where: { id: existing.id }, data })
		: await prisma.libraryItem.create({ data: { userId: user.id, name, ...data } });

	return NextResponse.json({ item }, { status: 201 });
});
