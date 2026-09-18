"use client";

import { useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { DateStrip } from "@/components/common/date-strip";
import { EmptyState, SectionTitle, Spinner } from "@/components/common/bits";
import { Ring } from "@/components/common/ring";
import { AddFoodSheet } from "./add_food_sheet";
import { api, refreshAll, useResource } from "@/lib/api";
import { MEAL_TYPES, type Bootstrap, type MealEntry, type MealType } from "@/lib/types";
import type { TabProps } from "@/components/navigation_tabs/tracker_map";

type MealsResponse = { date: string; entries: MealEntry[] };

export const NutritionTab = ({ date, onDateChange }: TabProps) => {
	const mealsKey = `/api/meals?date=${date}`;
	const meals = useResource<MealsResponse>(mealsKey);
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");

	const [addOpen, setAddOpen] = useState(false);
	const [addMeal, setAddMeal] = useState<MealType>(suggestedMeal());

	const entries = meals.data?.entries;
	const profile = bootstrap.data?.profile;
	const calorieTarget = profile?.calorieTarget ?? 2000;
	const proteinTarget = profile?.proteinTarget ?? 120;

	const totals = useMemo(
		() =>
			(entries ?? []).reduce(
				(acc, entry) => ({
					calories: acc.calories + entry.calories,
					proteinG: acc.proteinG + entry.proteinG,
					carbsG: acc.carbsG + entry.carbsG,
					fatG: acc.fatG + entry.fatG,
				}),
				{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
			),
		[entries],
	);

	const remaining = calorieTarget - totals.calories;
	const favorites = (bootstrap.data?.foods ?? []).filter((food) => food.favorite).slice(0, 8);

	const quickLog = async (foodId: string, name: string) => {
		try {
			await api.post("/api/meals", { date, foodId, meal: suggestedMeal(), servings: 1 });
			toast.success(`${name} logged`);
			await refreshAll(mealsKey, "/api/insights");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not log that");
		}
	};

	const removeEntry = async (entry: MealEntry) => {
		try {
			await api.del(`/api/meals/${entry.id}`);
			await refreshAll(mealsKey, "/api/insights");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not remove that");
		}
	};

	const openAdd = (meal: MealType) => {
		setAddMeal(meal);
		setAddOpen(true);
	};

	return (
		<div className="space-y-4">
			<DateStrip value={date} onChange={onDateChange} />

			{meals.loading ? (
				<Spinner label="Loading what you ate" />
			) : (
				<>
					<section className="rounded-2xl border border-border bg-card p-4">
						<div className="flex items-center justify-center">
							<Ring
								value={totals.calories}
								max={calorieTarget}
								color="var(--accent-food)"
								label={remaining >= 0 ? `${remaining.toLocaleString()} kcal left` : `${Math.abs(remaining).toLocaleString()} kcal over`}
								caption={`Target ${calorieTarget.toLocaleString()} kcal`}
								overIsBad
							/>
						</div>

						<div className="mt-4 grid grid-cols-3 gap-2">
							<MacroBar
								label="Protein"
								value={totals.proteinG}
								target={proteinTarget}
								color="var(--viz-1)"
							/>
							<MacroBar label="Carbs" value={totals.carbsG} color="var(--viz-2)" />
							<MacroBar label="Fat" value={totals.fatG} color="var(--viz-3)" />
						</div>
					</section>

					{favorites.length > 0 && (
						<section>
							<SectionTitle title="Quick add" caption="One tap, one serving" />
							<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
								{favorites.map((food) => (
									<button
										key={food.id}
										type="button"
										onClick={() => quickLog(food.id, food.name)}
										className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border border-border bg-card px-2 py-3 active:scale-95"
									>
										<span className="text-2xl">{food.emoji}</span>
										<span className="line-clamp-2 text-center text-[11px] leading-tight font-medium">
											{food.name}
										</span>
										<span className="text-[10px] text-muted-foreground">{food.calories} kcal</span>
									</button>
								))}
							</div>
						</section>
					)}

					<section className="space-y-3">
						{MEAL_TYPES.map((meal) => {
							const mealEntries = (entries ?? []).filter((entry) => entry.meal === meal.id);
							const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

							return (
								<div key={meal.id} className="rounded-2xl border border-border bg-card p-3.5">
									<div className="flex items-center gap-2">
										<span className="text-base">{meal.emoji}</span>
										<h3 className="flex-1 text-sm font-semibold">{meal.label}</h3>
										{mealCalories > 0 && (
											<span className="text-xs text-muted-foreground tabular-nums">
												{mealCalories.toLocaleString()} kcal
											</span>
										)}
										<button
											type="button"
											aria-label={`Add to ${meal.label}`}
											onClick={() => openAdd(meal.id)}
											className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground active:scale-95"
										>
											<FiPlus size={15} />
										</button>
									</div>

									{mealEntries.length > 0 && (
										<ul className="mt-2 space-y-1">
											{mealEntries.map((entry) => (
												<li
													key={entry.id}
													className="flex items-center gap-2 rounded-xl px-1 py-1.5"
												>
													<span className="text-base">{entry.emoji}</span>
													<span className="min-w-0 flex-1">
														<span className="block truncate text-sm">{entry.name}</span>
														{entry.servings !== 1 && (
															<span className="block text-xs text-muted-foreground">
																{entry.servings} servings
															</span>
														)}
													</span>
													<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
														{entry.calories}
													</span>
													<button
														type="button"
														aria-label={`Remove ${entry.name}`}
														onClick={() => removeEntry(entry)}
														className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground active:scale-95"
													>
														<FiTrash2 size={14} />
													</button>
												</li>
											))}
										</ul>
									)}
								</div>
							);
						})}
					</section>

					{(entries ?? []).length === 0 && (
						<EmptyState
							emoji="🍽️"
							title="Nothing logged yet"
							body="Tap a quick-add tile, or use the + on any meal."
						/>
					)}
				</>
			)}

			<AddFoodSheet
				open={addOpen}
				onClose={() => setAddOpen(false)}
				date={date}
				foods={bootstrap.data?.foods ?? []}
				defaultMeal={addMeal}
				onLogged={() => refreshAll(mealsKey, "/api/insights")}
			/>
		</div>
	);
};

/** Guess the meal from the clock so the common case needs no thought. */
const suggestedMeal = (): MealType => {
	const hour = new Date().getHours();
	if (hour < 11) return "breakfast";
	if (hour < 16) return "lunch";
	if (hour < 22) return "dinner";
	return "snack";
};

const MacroBar = ({
	label,
	value,
	target,
	color,
}: {
	label: string;
	value: number;
	target?: number;
	color: string;
}) => {
	const ratio = target ? Math.min(1, value / target) : 0;

	return (
		<div className="rounded-xl bg-secondary px-2.5 py-2">
			<div className="flex items-baseline justify-between">
				<span className="text-[11px] text-muted-foreground">{label}</span>
				<span className="text-xs font-semibold tabular-nums">{Math.round(value)}g</span>
			</div>
			{target ? (
				<>
					<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
						<div
							className="h-full rounded-full transition-[width] duration-500"
							style={{ width: `${ratio * 100}%`, backgroundColor: color }}
						/>
					</div>
					<div className="mt-1 text-[10px] text-muted-foreground">of {target}g</div>
				</>
			) : (
				<div className="mt-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${color}55` }} />
			)}
		</div>
	);
};
