"use client";

import { useMemo, useState } from "react";
import { FiEdit2, FiMinus, FiPlus, FiSearch, FiStar } from "react-icons/fi";
import { toast } from "sonner";
import { Sheet } from "@/components/common/sheet";
import {
	GhostButton,
	Labelled,
	PrimaryButton,
	SegmentedControl,
	TextInput,
} from "@/components/common/bits";
import { FoodEditor } from "./food_editor";
import { api, refreshAll, useAction } from "@/lib/api";
import { MEAL_TYPES, type Food, type MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	date: string;
	foods: Food[];
	defaultMeal: MealType;
	onLogged: () => void;
};

type Mode = "saved" | "custom";

/**
 * The one place you log food: pick something saved and scale the servings, or
 * type a one-off with its own calorie number.
 */
export const AddFoodSheet = ({ open, onClose, date, foods, defaultMeal, onLogged }: Props) => {
	const [mode, setMode] = useState<Mode>("saved");
	const [meal, setMeal] = useState<MealType>(defaultMeal);
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Food | null>(null);
	const [servings, setServings] = useState(1);

	const [custom, setCustom] = useState({ name: "", calories: "", proteinG: "", save: false });

	const [editorFood, setEditorFood] = useState<Food | null>(null);
	const [editorOpen, setEditorOpen] = useState(false);

	const { pending, run } = useAction();

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return foods;
		return foods.filter(
			(food) =>
				food.name.toLowerCase().includes(q) || food.category.toLowerCase().includes(q),
		);
	}, [foods, query]);

	const reset = () => {
		setSelected(null);
		setServings(1);
		setQuery("");
		setCustom({ name: "", calories: "", proteinG: "", save: false });
	};

	const logSaved = async () => {
		if (!selected) return;
		const result = await run(
			() => api.post("/api/meals", { date, foodId: selected.id, meal, servings }),
			(message) => toast.error(message),
		);
		if (!result) return;
		toast.success(`${selected.emoji} ${selected.name} logged`);
		reset();
		onLogged();
		onClose();
	};

	const logCustom = async () => {
		if (!custom.name.trim()) {
			toast.error("What did you eat?");
			return;
		}
		if (custom.calories.trim() === "" || Number(custom.calories) < 0) {
			toast.error("Enter roughly how many calories");
			return;
		}

		const result = await run(
			() =>
				api.post("/api/meals", {
					date,
					meal,
					name: custom.name.trim(),
					calories: Number(custom.calories),
					proteinG: Number(custom.proteinG) || 0,
					servings: 1,
					saveToLibrary: custom.save,
				}),
			(message) => toast.error(message),
		);

		if (!result) return;
		toast.success(`${custom.name.trim()} logged`);
		if (custom.save) await refreshAll("/api/bootstrap", "/api/foods");
		reset();
		onLogged();
		onClose();
	};

	const previewCalories = selected ? Math.round(selected.calories * servings) : 0;

	return (
		<>
			<Sheet
				open={open}
				onClose={onClose}
				title="Log food"
				subtitle={MEAL_TYPES.find((m) => m.id === meal)?.label}
				footer={
					mode === "saved" ? (
						<PrimaryButton onClick={logSaved} disabled={pending || !selected}>
							{selected
								? pending
									? "Logging…"
									: `Log ${previewCalories} kcal`
								: "Pick something first"}
						</PrimaryButton>
					) : (
						<PrimaryButton onClick={logCustom} disabled={pending}>
							{pending ? "Logging…" : "Log it"}
						</PrimaryButton>
					)
				}
			>
				<div className="sticky top-0 z-10 space-y-3 bg-background pb-3">
					<SegmentedControl
						value={mode}
						onChange={(next) => setMode(next)}
						options={[
							{ id: "saved", label: "My foods" },
							{ id: "custom", label: "One-off" },
						]}
					/>

					<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
						{MEAL_TYPES.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setMeal(option.id)}
								aria-pressed={meal === option.id}
								className={cn(
									"shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95",
									meal === option.id
										? "border-foreground bg-foreground text-background"
										: "border-border text-muted-foreground",
								)}
							>
								{option.emoji} {option.label}
							</button>
						))}
					</div>
				</div>

				{mode === "saved" ? (
					<div className="space-y-3 pb-2">
						<div className="relative">
							<FiSearch
								size={16}
								className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
							/>
							<TextInput
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search your foods"
								className="pl-9"
							/>
						</div>

						{selected && (
							<div className="rounded-2xl border border-foreground bg-secondary p-3">
								<div className="flex items-center gap-2">
									<span className="text-xl">{selected.emoji}</span>
									<div className="min-w-0 flex-1">
										<div className="truncate text-sm font-medium">{selected.name}</div>
										<div className="text-xs text-muted-foreground">
											{selected.calories} kcal per {selected.servingLabel}
										</div>
									</div>
								</div>

								<div className="mt-3 flex items-center justify-between gap-3">
									<span className="text-sm text-muted-foreground">Servings</span>
									<div className="flex items-center gap-2">
										<StepButton
											label="Fewer servings"
											onClick={() => setServings((v) => Math.max(0.25, Math.round((v - 0.25) * 100) / 100))}
										>
											<FiMinus size={15} />
										</StepButton>
										<span className="w-12 text-center text-base font-semibold tabular-nums">
											{servings}
										</span>
										<StepButton
											label="More servings"
											onClick={() => setServings((v) => Math.round((v + 0.25) * 100) / 100)}
										>
											<FiPlus size={15} />
										</StepButton>
									</div>
								</div>

								<div className="mt-2 text-xs text-muted-foreground">
									{previewCalories} kcal · {(selected.proteinG * servings).toFixed(1)} g protein
								</div>
							</div>
						)}

						<ul className="space-y-1.5">
							{matches.map((food) => (
								<li key={food.id} className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => {
											setSelected(food);
											setServings(1);
										}}
										aria-pressed={selected?.id === food.id}
										className={cn(
											"flex min-h-12 flex-1 items-center gap-3 rounded-xl border px-3 py-2 text-left transition active:scale-[0.99]",
											selected?.id === food.id ? "border-foreground bg-secondary" : "border-border",
										)}
									>
										<span className="text-lg">{food.emoji}</span>
										<span className="min-w-0 flex-1">
											<span className="flex items-center gap-1.5">
												<span className="truncate text-sm font-medium">{food.name}</span>
												{food.favorite && (
													<FiStar size={11} className="shrink-0 fill-current text-[var(--warning)]" />
												)}
											</span>
											<span className="block truncate text-xs text-muted-foreground">
												{food.calories} kcal · {food.servingLabel}
											</span>
										</span>
									</button>
									<button
										type="button"
										aria-label={`Edit ${food.name}`}
										onClick={() => {
											setEditorFood(food);
											setEditorOpen(true);
										}}
										className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground active:scale-95"
									>
										<FiEdit2 size={14} />
									</button>
								</li>
							))}
						</ul>

						<GhostButton
							className="flex w-full items-center justify-center gap-2"
							onClick={() => {
								setEditorFood(null);
								setEditorOpen(true);
							}}
						>
							<FiPlus size={15} />
							New saved food
						</GhostButton>
					</div>
				) : (
					<div className="space-y-4 pb-2">
						<p className="text-sm text-muted-foreground">
							For the street samosa you&rsquo;ll never log twice. Estimate the calories and move on.
						</p>

						<Labelled label="What was it?">
							<TextInput
								value={custom.name}
								onChange={(e) => setCustom((p) => ({ ...p, name: e.target.value }))}
								placeholder="Birthday cake slice"
								autoFocus
							/>
						</Labelled>

						<Labelled label="Calories">
							<TextInput
								type="number"
								inputMode="numeric"
								min={0}
								value={custom.calories}
								onChange={(e) => setCustom((p) => ({ ...p, calories: e.target.value }))}
								placeholder="350"
							/>
						</Labelled>

						<Labelled label="Protein (optional)">
							<TextInput
								type="number"
								inputMode="decimal"
								min={0}
								value={custom.proteinG}
								onChange={(e) => setCustom((p) => ({ ...p, proteinG: e.target.value }))}
								placeholder="g"
							/>
						</Labelled>

						<label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3">
							<input
								type="checkbox"
								checked={custom.save}
								onChange={(e) => setCustom((p) => ({ ...p, save: e.target.checked }))}
								className="size-5 accent-[var(--foreground)]"
							/>
							<span className="text-sm">Also save it to my foods</span>
						</label>
					</div>
				)}
			</Sheet>

			<FoodEditor open={editorOpen} onClose={() => setEditorOpen(false)} food={editorFood} />
		</>
	);
};

const StepButton = ({
	label,
	children,
	...props
}: React.ComponentProps<"button"> & { label: string }) => (
	<button
		type="button"
		aria-label={label}
		className="grid size-10 place-items-center rounded-xl border border-border bg-background active:scale-95"
		{...props}
	>
		{children}
	</button>
);
