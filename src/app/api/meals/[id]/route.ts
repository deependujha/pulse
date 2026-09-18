import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { notFound, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const { count } = await prisma.mealEntry.deleteMany({ where: { id, userId: user.id } });
	if (count === 0) return notFound("Entry not found");
	return NextResponse.json({ ok: true });
});
