import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { bool, notFound, num, readJson, str, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withUser<Ctx>(async (user, req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.libraryItem.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Not in your library");

	const body = await readJson(req);
	const item = await prisma.libraryItem.update({
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
			favorite: "favorite" in body ? bool(body.favorite, owned.favorite) : undefined,
		},
	});
	return NextResponse.json({ item });
});

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.libraryItem.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Not in your library");

	// Archived, not deleted — already-logged entries keep their link.
	await prisma.libraryItem.update({ where: { id }, data: { archived: true } });
	return NextResponse.json({ ok: true });
});
