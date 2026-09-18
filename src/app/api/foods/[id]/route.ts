import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { bool, notFound, num, readJson, str, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withUser<Ctx>(async (user, req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.food.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Food not found");

	const body = await readJson(req);
	const food = await prisma.food.update({
		where: { id },
		data: {
			name: "name" in body ? str(body.name, owned.name) || owned.name : undefined,
			emoji: "emoji" in body ? str(body.emoji, owned.emoji) : undefined,
			servingLabel:
				"servingLabel" in body ? str(body.servingLabel, owned.servingLabel) : undefined,
			calories:
				"calories" in body
					? Math.max(0, Math.round(num(body.calories, owned.calories)))
					: undefined,
			proteinG: "proteinG" in body ? Math.max(0, num(body.proteinG, owned.proteinG)) : undefined,
			carbsG: "carbsG" in body ? Math.max(0, num(body.carbsG, owned.carbsG)) : undefined,
			fatG: "fatG" in body ? Math.max(0, num(body.fatG, owned.fatG)) : undefined,
			category: "category" in body ? str(body.category, owned.category) : undefined,
			favorite: "favorite" in body ? bool(body.favorite, owned.favorite) : undefined,
		},
	});
	return NextResponse.json({ food });
});

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.food.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Food not found");

	// Archived, not deleted — already-logged meals keep their link.
	await prisma.food.update({ where: { id }, data: { archived: true } });
	return NextResponse.json({ ok: true });
});
