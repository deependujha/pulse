import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey, todayKey } from "@/lib/dates";
import { badRequest, notFound, num, readJson, str, withUser } from "@/server/http";

const MEALS = ["breakfast", "lunch", "snack", "dinner"];

export const GET = withUser(async (user, req) => {
	const url = new URL(req.url);
	const date = url.searchParams.get("date") ?? todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const entries = await prisma.mealEntry.findMany({
		where: { userId: user.id, date },
		orderBy: { createdAt: "asc" },
	});

	return NextResponse.json({ date, entries });
});

/**
 * Log something eaten. Either reference a library item (`itemId`, scaled by
 * `servings`) or pass a one-off `name` + `calories` for anything you'll never
 * log twice.
 */
export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const date = str(body.date) || todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const meal = MEALS.includes(str(body.meal)) ? str(body.meal) : "snack";
	const servings = Math.max(0.05, num(body.servings, 1));
	const itemId = str(body.itemId) || null;

	let payload: {
		name: string;
		emoji: string;
		calories: number;
		proteinG: number;
		carbsG: number;
		fatG: number;
		fiberG: number;
	};

	if (itemId) {
		const item = await prisma.libraryItem.findFirst({ where: { id: itemId, userId: user.id } });
		if (!item) return notFound("Not in your library");
		payload = {
			name: item.name,
			emoji: item.emoji,
			calories: Math.round(item.calories * servings),
			proteinG: round1(item.proteinG * servings),
			carbsG: round1(item.carbsG * servings),
			fatG: round1(item.fatG * servings),
			fiberG: round1(item.fiberG * servings),
		};
	} else {
		const name = str(body.name);
		if (!name) return badRequest("What did you eat?");
		const calories = Math.round(num(body.calories, -1));
		if (calories < 0) return badRequest("Calories must be a positive number");
		payload = {
			name,
			emoji: str(body.emoji, "🍽️") || "🍽️",
			calories: Math.round(calories * servings),
			proteinG: round1(Math.max(0, num(body.proteinG, 0)) * servings),
			carbsG: round1(Math.max(0, num(body.carbsG, 0)) * servings),
			fatG: round1(Math.max(0, num(body.fatG, 0)) * servings),
			fiberG: round1(Math.max(0, num(body.fiberG, 0)) * servings),
		};
	}

	const entry = await prisma.mealEntry.create({
		data: { userId: user.id, date, itemId, meal, servings, ...payload },
	});

	// Optionally promote a one-off into the library in the same tap.
	if (!itemId && body.saveToLibrary === true) {
		const name = payload.name;
		const exists = await prisma.libraryItem.findUnique({
			where: { userId_name: { userId: user.id, name } },
		});
		if (!exists) {
			await prisma.libraryItem.create({
				data: {
					userId: user.id,
					name,
					emoji: payload.emoji,
					servingLabel: str(body.servingLabel, "1 serving") || "1 serving",
					// The library stores per-serving values, so use what was typed
					// rather than the already-scaled numbers on the entry.
					calories: Math.round(num(body.calories, payload.calories)),
					proteinG: Math.max(0, num(body.proteinG, 0)),
					carbsG: Math.max(0, num(body.carbsG, 0)),
					fatG: Math.max(0, num(body.fatG, 0)),
					fiberG: Math.max(0, num(body.fiberG, 0)),
				},
			});
		}
	}

	return NextResponse.json({ entry }, { status: 201 });
});

const round1 = (n: number) => Math.round(n * 10) / 10;
