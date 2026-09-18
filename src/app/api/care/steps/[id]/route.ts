import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { notFound, optionalStr, readJson, str, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };
const FREQUENCIES = ["EVERY_DAY", "ALTERNATE", "WEEKDAYS"];

const parseWeekdays = (value: unknown): number[] =>
	Array.isArray(value)
		? [...new Set(value.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort()
		: [];

export const PATCH = withUser<Ctx>(async (user, req, ctx) => {
	const { id } = await ctx.params;
	const owned = await prisma.careStep.findFirst({ where: { id, userId: user.id } });
	if (!owned) return notFound("Step not found");

	const body = await readJson(req);
	const frequency =
		"frequency" in body && FREQUENCIES.includes(str(body.frequency))
			? str(body.frequency)
			: undefined;

	const step = await prisma.careStep.update({
		where: { id },
		data: {
			name: "name" in body ? str(body.name, owned.name) || owned.name : undefined,
			note: "note" in body ? optionalStr(body.note) : undefined,
			product: "product" in body ? optionalStr(body.product) : undefined,
			emoji: "emoji" in body ? str(body.emoji, owned.emoji) : undefined,
			phase: "phase" in body ? (str(body.phase) === "PM" ? "PM" : "AM") : undefined,
			frequency,
			weekdays:
				"weekdays" in body || frequency
					? (frequency ?? owned.frequency) === "WEEKDAYS"
						? parseWeekdays("weekdays" in body ? body.weekdays : owned.weekdays)
						: []
					: undefined,
		},
	});
	return NextResponse.json({ step });
});

export const DELETE = withUser<Ctx>(async (user, _req, ctx) => {
	const { id } = await ctx.params;
	const { count } = await prisma.careStep.updateMany({
		where: { id, userId: user.id },
		data: { archived: true },
	});
	if (count === 0) return notFound("Step not found");
	return NextResponse.json({ ok: true });
});
