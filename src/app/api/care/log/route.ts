import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey, todayKey } from "@/lib/dates";
import { badRequest, notFound, readJson, str, withUser } from "@/server/http";

export const GET = withUser(async (user, req) => {
	const url = new URL(req.url);
	const date = url.searchParams.get("date") ?? todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const logs = await prisma.careLog.findMany({
		where: { userId: user.id, date },
		select: { stepId: true },
	});
	return NextResponse.json({ date, doneStepIds: logs.map((l) => l.stepId) });
});

export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const date = str(body.date) || todayKey();
	const stepId = str(body.stepId);
	const done = body.done !== false;

	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");
	if (!stepId) return badRequest("stepId is required");

	const owned = await prisma.careStep.findFirst({
		where: { id: stepId, userId: user.id },
		select: { id: true },
	});
	if (!owned) return notFound("Step not found");

	if (done) {
		await prisma.careLog.upsert({
			where: { userId_date_stepId: { userId: user.id, date, stepId } },
			update: {},
			create: { userId: user.id, date, stepId },
		});
	} else {
		await prisma.careLog.deleteMany({ where: { userId: user.id, date, stepId } });
	}

	return NextResponse.json({ ok: true, done });
});
