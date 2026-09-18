import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { num, optionalNum, readJson, withUser } from "@/server/http";

export const GET = withUser(async (user) => {
	const profile = await prisma.user.findUnique({
		where: { id: user.id },
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			calorieTarget: true,
			proteinTarget: true,
			heightCm: true,
			goalWeightKg: true,
			createdAt: true,
		},
	});
	return NextResponse.json({ profile });
});

export const PATCH = withUser(async (user, req) => {
	const body = await readJson(req);

	const profile = await prisma.user.update({
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
			heightCm: "heightCm" in body ? optionalNum(body.heightCm) : undefined,
			goalWeightKg: "goalWeightKg" in body ? optionalNum(body.goalWeightKg) : undefined,
		},
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			calorieTarget: true,
			proteinTarget: true,
			heightCm: true,
			goalWeightKg: true,
			createdAt: true,
		},
	});
	return NextResponse.json({ profile });
});

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
