import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { badRequest, optionalStr, readJson, str, withUser } from "@/server/http";

const FREQUENCIES = ["EVERY_DAY", "ALTERNATE", "WEEKDAYS"];

const parseWeekdays = (value: unknown): number[] =>
	Array.isArray(value)
		? [...new Set(value.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort()
		: [];

export const GET = withUser(async (user) => {
	const steps = await prisma.careStep.findMany({
		where: { userId: user.id, archived: false },
		orderBy: [{ phase: "asc" }, { position: "asc" }],
	});
	return NextResponse.json({ steps });
});

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const name = str(body.name);
	if (!name) return badRequest("Give the step a name");

	const phase = str(body.phase) === "PM" ? "PM" : "AM";
	const frequency = FREQUENCIES.includes(str(body.frequency))
		? str(body.frequency)
		: "EVERY_DAY";

	const last = await prisma.careStep.findFirst({
		where: { userId: user.id, phase },
		orderBy: { position: "desc" },
		select: { position: true },
	});

	const step = await prisma.careStep.create({
		data: {
			userId: user.id,
			name,
			note: optionalStr(body.note),
			product: optionalStr(body.product),
			emoji: str(body.emoji, "🧴") || "🧴",
			phase,
			frequency,
			weekdays: frequency === "WEEKDAYS" ? parseWeekdays(body.weekdays) : [],
			position: (last?.position ?? -1) + 1,
		},
	});
	return NextResponse.json({ step }, { status: 201 });
});

/** Reorder a phase in one shot: { phase, ids: [...] } */
export const PUT = withUser(async (user, req) => {
	const body = await readJson(req);
	const ids = Array.isArray(body.ids) ? body.ids.map((id) => str(id)).filter(Boolean) : [];
	if (ids.length === 0) return badRequest("ids is required");

	const owned = await prisma.careStep.findMany({
		where: { id: { in: ids }, userId: user.id },
		select: { id: true },
	});
	const ownedIds = new Set(owned.map((s) => s.id));

	await prisma.$transaction(
		ids
			.filter((id) => ownedIds.has(id))
			.map((id, position) =>
				prisma.careStep.update({ where: { id }, data: { position } }),
			),
	);
	return NextResponse.json({ ok: true });
});

