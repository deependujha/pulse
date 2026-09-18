import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey, todayKey } from "@/lib/dates";
import { badRequest, num, optionalNum, optionalStr, readJson, str, withUser } from "@/server/http";

export const GET = withUser(async (user, req) => {
	const url = new URL(req.url);
	const date = url.searchParams.get("date") ?? todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const metric = await prisma.dailyMetric.findUnique({
		where: { userId_date: { userId: user.id, date } },
	});

	// Weight is sparse — fall back to the most recent reading so the UI can
	// show "last known" instead of a blank.
	const lastWeight = await prisma.dailyMetric.findFirst({
		where: { userId: user.id, weightKg: { not: null } },
		orderBy: { date: "desc" },
		select: { date: true, weightKg: true },
	});

	return NextResponse.json({
		date,
		metric: metric ?? { date, weightKg: null, waterMl: 0, sleepHours: null, note: null },
		lastWeight,
	});
});

export const PUT = withUser(async (user, req) => {
	const body = await readJson(req);
	const date = str(body.date) || todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const data = {
		weightKg: "weightKg" in body ? optionalNum(body.weightKg) : undefined,
		waterMl: "waterMl" in body ? Math.max(0, Math.round(num(body.waterMl, 0))) : undefined,
		sleepHours: "sleepHours" in body ? optionalNum(body.sleepHours) : undefined,
		note: "note" in body ? optionalStr(body.note) : undefined,
	};

	const metric = await prisma.dailyMetric.upsert({
		where: { userId_date: { userId: user.id, date } },
		update: data,
		create: {
			userId: user.id,
			date,
			weightKg: data.weightKg ?? null,
			waterMl: data.waterMl ?? 0,
			sleepHours: data.sleepHours ?? null,
			note: data.note ?? null,
		},
	});
	return NextResponse.json({ metric });
});
