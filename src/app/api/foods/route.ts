import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, bool, num, readJson, str, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const foods = await prisma.food.findMany({
		where: { userId: user.id, archived: false },
		orderBy: [{ favorite: "desc" }, { name: "asc" }],
	});
	return NextResponse.json({ foods });
});

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const name = str(body.name);
	if (!name) return badRequest("Give the food a name");

	const calories = Math.max(0, Math.round(num(body.calories, -1)));
	if (!Number.isFinite(calories) || num(body.calories, -1) < 0) {
		return badRequest("Calories must be a positive number");
	}

	const data = {
		emoji: str(body.emoji, "🍽️") || "🍽️",
		servingLabel: str(body.servingLabel, "1 serving") || "1 serving",
		calories,
		proteinG: Math.max(0, num(body.proteinG, 0)),
		carbsG: Math.max(0, num(body.carbsG, 0)),
		fatG: Math.max(0, num(body.fatG, 0)),
		category: str(body.category, "Other") || "Other",
		favorite: bool(body.favorite),
		archived: false,
	};

	const existing = await prisma.food.findUnique({
		where: { userId_name: { userId: user.id, name } },
	});
	if (existing && !existing.archived) return badRequest(`"${name}" is already saved`);

	const food = existing
		? await prisma.food.update({ where: { id: existing.id }, data })
		: await prisma.food.create({ data: { userId: user.id, name, ...data } });

	return NextResponse.json({ food }, { status: 201 });
});
