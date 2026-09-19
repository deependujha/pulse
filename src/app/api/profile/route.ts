import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { todayKey } from "@/lib/dates";
import { PROFILE_SELECT, syncWeightSnapshot } from "@/server/profile";
import { num, optionalNum, readJson, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const profile = await prisma.user.findUnique({
		where: { id: user.id },
		select: PROFILE_SELECT,
	});
	return NextResponse.json({ profile });
});

export const PATCH = withUser(async (user, req) => {
	const body = await readJson(req);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			calorieTarget:
				"calorieTarget" in body
					? clamp(Math.round(num(body.calorieTarget, user.calorieTarget)), 800, 8000)
					: undefined,
			proteinTarget:
				"proteinTarget" in body
					? clamp(Math.round(num(body.proteinTarget, user.proteinTarget)), 0, 400)
					: undefined,
			carbsTargetG:
				"carbsTargetG" in body
					? clamp(Math.round(num(body.carbsTargetG, 220)), 0, 1000)
					: undefined,
			fatTargetG:
				"fatTargetG" in body ? clamp(Math.round(num(body.fatTargetG, 60)), 0, 400) : undefined,
			waterTargetMl:
				"waterTargetMl" in body
					? clamp(Math.round(num(body.waterTargetMl, 2500)), 0, 10000)
					: undefined,
			sleepTargetHours:
				"sleepTargetHours" in body ? clamp(num(body.sleepTargetHours, 8), 0, 16) : undefined,
			heightCm: "heightCm" in body ? optionalNum(body.heightCm) : undefined,
			goalWeightKg: "goalWeightKg" in body ? optionalNum(body.goalWeightKg) : undefined,
		},
		select: { id: true },
	});

	// Current weight isn't stored here first: it's a weigh-in like any other, so
	// it lands on today's metric row and the snapshot is derived back from that.
	// Charts and the Today tab then agree with the profile without a second edit.
	if ("currentWeightKg" in body) {
		const weightKg = optionalNum(body.currentWeightKg);
		if (weightKg !== null) {
			const date = todayKey();
			await prisma.dailyMetric.upsert({
				where: { userId_date: { userId: user.id, date } },
				update: { weightKg },
				create: { userId: user.id, date, weightKg },
			});
		}
		await syncWeightSnapshot(user.id);
	}

	const profile = await prisma.user.findUnique({
		where: { id: user.id },
		select: PROFILE_SELECT,
	});
	return NextResponse.json({ profile });
});

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
