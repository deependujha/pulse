import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { isValidDayKey, todayKey } from "@/lib/dates";
import { badRequest, notFound, num, readJson, str, withUser } from "@/server/http";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

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
 * Log something eaten. Either reference a saved food (`foodId`, scaled by
 * `servings`) or pass a one-off `name` + `calories` for anything not worth
 * saving to the library.
 */
export const POST = withUser(async (user, req) => {
	const body = await readJson(req);
	const date = str(body.date) || todayKey();
	if (!isValidDayKey(date)) return badRequest("date must be YYYY-MM-DD");

	const meal = MEALS.includes(str(body.meal)) ? str(body.meal) : "snack";
	const servings = Math.max(0.05, num(body.servings, 1));
	const foodId = str(body.foodId) || null;

	let payload: {
		name: string;
		emoji: string;
		calories: number;
		proteinG: number;
		carbsG: number;
		fatG: number;
	};

	if (foodId) {
		const food = await prisma.food.findFirst({ where: { id: foodId, userId: user.id } });
		if (!food) return notFound("Food not found");
		payload = {
			name: food.name,
			emoji: food.emoji,
			calories: Math.round(food.calories * servings),
			proteinG: round1(food.proteinG * servings),
			carbsG: round1(food.carbsG * servings),
			fatG: round1(food.fatG * servings),
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
		};
	}

	const entry = await prisma.mealEntry.create({
		data: { userId: user.id, date, foodId, meal, servings, ...payload },
	});

	// Optionally promote a one-off into the saved library in the same tap.
	if (!foodId && body.saveToLibrary === true) {
		const name = payload.name;
		const exists = await prisma.food.findUnique({
			where: { userId_name: { userId: user.id, name } },
		});
		if (!exists) {
			await prisma.food.create({
				data: {
					userId: user.id,
					name,
					emoji: payload.emoji,
					servingLabel: str(body.servingLabel, "1 serving") || "1 serving",
					calories: Math.round(num(body.calories, payload.calories)),
					proteinG: Math.max(0, num(body.proteinG, 0)),
					carbsG: Math.max(0, num(body.carbsG, 0)),
					fatG: Math.max(0, num(body.fatG, 0)),
					category: str(body.category, "Other") || "Other",
				},
			});
		}
	}

	return NextResponse.json({ entry }, { status: 201 });
});

const round1 = (n: number) => Math.round(n * 10) / 10;
