"use client";

import { useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { DateStrip } from "@/components/common/date-strip";
import { GhostButton, SectionTitle, Spinner } from "@/components/common/bits";
import { Ring } from "@/components/common/ring";
import { ItemEditor } from "./item_editor";
import { LogSheet } from "./log_sheet";
import { api, refreshAll, useResource } from "@/lib/api";
import { MEAL_TYPES, type Bootstrap, type LibraryItem, type MealEntry, type MealType } from "@/lib/types";
import type { TabProps } from "@/components/navigation_tabs/tracker_map";

type MealsResponse = { date: string; entries: MealEntry[]; recentItemIds: string[] };

export const MacrosTab = ({ date, onDateChange }: TabProps) => {
	const mealsKey = `/api/meals?date=${date}`;
	const meals = useResource<MealsResponse>(mealsKey);
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");

	const [logOpen, setLogOpen] = useState(false);
	const [logMeal, setLogMeal] = useState<MealType>(suggestedMeal());
	const [editorOpen, setEditorOpen] = useState(false);

	const entries = useMemo(() => meals.data?.entries ?? [], [meals.data]);
	const library = useMemo(() => bootstrap.data?.library ?? [], [bootstrap.data]);
	const profile = bootstrap.data?.profile;
	const calorieTarget = profile?.calorieTarget ?? 2000;
	const proteinTarget = profile?.proteinTarget ?? 120;

	const totals = useMemo(
		() =>
			entries.reduce(
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

	// Recency comes back as ids so it always reflects the item's current numbers,
	// and anything archived simply stops resolving.
	const recent = useMemo(() => {
		const byId = new Map(library.map((item) => [item.id, item]));
		return (meals.data?.recentItemIds ?? [])
			.map((id) => byId.get(id))
			.filter((item): item is LibraryItem => item !== undefined);
	}, [library, meals.data]);

	const remaining = calorieTarget - totals.calories;

	const quickLog = async (item: LibraryItem) => {
		try {
			await api.post("/api/meals", { date, itemId: item.id, meal: suggestedMeal(), servings: 1 });
			toast.success(`${item.emoji} ${item.name} · ${item.calories} kcal`);
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

	const openLog = (meal: MealType) => {
		setLogMeal(meal);
		setLogOpen(true);
	};

	return (
		<div className="space-y-4">
			<DateStrip value={date} onChange={onDateChange} />

			{meals.loading ? (
				<Spinner label="Loading your day" />
			) : (
				<>
					<section className="rounded-2xl border border-border bg-card p-4">
						<div className="flex items-center justify-center">
							<Ring
								value={totals.calories}
								max={calorieTarget}
								color="var(--accent-food)"
								label={
									remaining >= 0
										? `${remaining.toLocaleString()} kcal left`
										: `${Math.abs(remaining).toLocaleString()} kcal over`
								}
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

					{/* An empty library is the only thing standing between a new account
					    and logging anything, so it gets the whole screen's attention. */}
					{library.length === 0 ? (
						<section className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
							<div className="text-3xl">📖</div>
							<h3 className="text-sm font-semibold">Start your library</h3>
							<p className="mx-auto max-w-xs text-xs text-muted-foreground">
								Nothing is pre-filled here on purpose. Add the things you actually eat, in the
								portions you actually use — a katori of dal, your scoop of whey — and logging
								becomes one tap.
							</p>
							<GhostButton
								className="mx-auto flex items-center justify-center gap-2"
								onClick={() => setEditorOpen(true)}
							>
								<FiPlus size={15} />
								Add your first item
							</GhostButton>
						</section>
					) : (
						recent.length > 0 && (
							<section>
								<SectionTitle title="Again" caption="What you log most often — one tap" />
								<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
									{recent.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() => quickLog(item)}
											className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border border-border bg-card px-2 py-3 active:scale-95"
										>
											<span className="text-2xl">{item.emoji}</span>
											<span className="line-clamp-2 text-center text-[11px] leading-tight font-medium">
												{item.name}
											</span>
											<span className="text-[10px] text-muted-foreground">
												{item.calories} kcal
											</span>
										</button>
									))}
								</div>
							</section>
						)
					)}

					<section className="space-y-3">
						{MEAL_TYPES.map((meal) => {
							const mealEntries = entries.filter((entry) => entry.meal === meal.id);
							const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

							return (
								<div key={meal.id} className="rounded-2xl border border-border bg-card p-3.5">
									<div className="flex items-center gap-2">
										<span className="text-base">{meal.emoji}</span>
										<h3 className="flex-1 text-sm font-semibold">{meal.label}</h3>
										<span className="text-xs text-muted-foreground tabular-nums">
											{mealCalories > 0 ? `${mealCalories.toLocaleString()} kcal` : "—"}
										</span>
										<button
											type="button"
											aria-label={`Add to ${meal.label}`}
											onClick={() => openLog(meal.id)}
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
														<span className="block text-xs text-muted-foreground">
															{entry.servings !== 1 && `${entry.servings} servings · `}
															{Math.round(entry.proteinG)}p · {Math.round(entry.carbsG)}c ·{" "}
															{Math.round(entry.fatG)}f
														</span>
													</span>
													<span className="shrink-0 text-sm tabular-nums">{entry.calories}</span>
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
				</>
			)}

			<LogSheet
				open={logOpen}
				onClose={() => setLogOpen(false)}
				date={date}
				library={library}
				defaultMeal={logMeal}
				onLogged={() => refreshAll(mealsKey, "/api/insights")}
			/>

			<ItemEditor open={editorOpen} onClose={() => setEditorOpen(false)} item={null} />
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
