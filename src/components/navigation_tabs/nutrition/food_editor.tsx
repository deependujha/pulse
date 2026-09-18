"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/common/sheet";
import { Labelled, PrimaryButton, Select, TextInput } from "@/components/common/bits";
import { api, refreshAll, useAction } from "@/lib/api";
import { FOOD_CATEGORIES, type Food } from "@/lib/types";

const FOOD_EMOJIS = ["🍽️", "🫓", "🍚", "🍲", "🥘", "🧀", "🥚", "🍗", "🥤", "🥛", "🥣", "🍌", "🥜", "☕", "🍿", "🍩"];

const blank = {
	name: "",
	emoji: "🍽️",
	servingLabel: "1 serving",
	calories: "",
	proteinG: "",
	carbsG: "",
	fatG: "",
	category: "Other",
};

type Props = {
	open: boolean;
	onClose: () => void;
	food: Food | null;
	/** Pre-fill from a one-off entry the user is promoting into the library. */
	preset?: Partial<typeof blank>;
};

/**
 * Create or edit a saved food. Calories are always per one serving.
 * Mounted only while open and keyed on the food, so the fields seed from props.
 */
export const FoodEditor = (props: Props) => {
	if (!props.open) return null;
	return <FoodForm key={props.food?.id ?? "new"} {...props} />;
};

const FoodForm = ({ open, onClose, food, preset }: Props) => {
	const [form, setForm] = useState(() =>
		food
			? {
					name: food.name,
					emoji: food.emoji,
					servingLabel: food.servingLabel,
					calories: String(food.calories),
					proteinG: String(food.proteinG),
					carbsG: String(food.carbsG),
					fatG: String(food.fatG),
					category: food.category,
				}
			: { ...blank, ...preset },
	);
	const { pending, run } = useAction();

	const set = (key: keyof typeof blank, value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const save = async () => {
		if (!form.name.trim()) {
			toast.error("Give the food a name");
			return;
		}
		if (form.calories.trim() === "" || Number(form.calories) < 0) {
			toast.error("Enter the calories per serving");
			return;
		}

		const body = {
			name: form.name.trim(),
			emoji: form.emoji,
			servingLabel: form.servingLabel.trim() || "1 serving",
			calories: Number(form.calories),
			proteinG: Number(form.proteinG) || 0,
			carbsG: Number(form.carbsG) || 0,
			fatG: Number(form.fatG) || 0,
			category: form.category,
		};

		const result = await run(
			() => (food ? api.patch(`/api/foods/${food.id}`, body) : api.post("/api/foods", body)),
			(message) => toast.error(message),
		);

		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/foods");
		toast.success(food ? "Food updated" : "Saved to your foods");
		onClose();
	};

	const remove = async () => {
		if (!food) return;
		const result = await run(
			() => api.del(`/api/foods/${food.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/foods");
		toast.success(`Removed ${food.name}`);
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={food ? "Edit food" : "New food"}
			subtitle="Everything is per one serving"
			footer={
				<div className="space-y-2">
					<PrimaryButton onClick={save} disabled={pending}>
						{pending ? "Saving…" : food ? "Save changes" : "Save food"}
					</PrimaryButton>
					{food && (
						<button
							type="button"
							onClick={remove}
							disabled={pending}
							className="h-10 w-full rounded-xl text-sm font-medium text-[var(--critical)] active:scale-[0.99]"
						>
							Delete food
						</button>
					)}
				</div>
			}
		>
			<div className="space-y-4 pb-2">
				<Labelled label="Name">
					<TextInput
						value={form.name}
						onChange={(e) => set("name", e.target.value)}
						placeholder="Paneer bhurji"
						autoFocus={!food}
					/>
				</Labelled>

				<div>
					<span className="mb-1.5 block text-sm font-medium">Icon</span>
					<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
						{FOOD_EMOJIS.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => set("emoji", option)}
								aria-pressed={form.emoji === option}
								className={`grid size-11 shrink-0 place-items-center rounded-xl border text-xl transition active:scale-95 ${
									form.emoji === option ? "border-foreground bg-secondary" : "border-border"
								}`}
							>
								{option}
							</button>
						))}
					</div>
				</div>

				<Labelled label="Serving" hint="What one serving means to you">
					<TextInput
						value={form.servingLabel}
						onChange={(e) => set("servingLabel", e.target.value)}
						placeholder="1 katori · 100 g · 1 piece"
					/>
				</Labelled>

				<Labelled label="Calories per serving">
					<TextInput
						type="number"
						inputMode="numeric"
						min={0}
						value={form.calories}
						onChange={(e) => set("calories", e.target.value)}
						placeholder="250"
					/>
				</Labelled>

				<div className="grid grid-cols-3 gap-2">
					<Labelled label="Protein">
						<TextInput
							type="number"
							inputMode="decimal"
							min={0}
							value={form.proteinG}
							onChange={(e) => set("proteinG", e.target.value)}
							placeholder="g"
						/>
					</Labelled>
					<Labelled label="Carbs">
						<TextInput
							type="number"
							inputMode="decimal"
							min={0}
							value={form.carbsG}
							onChange={(e) => set("carbsG", e.target.value)}
							placeholder="g"
						/>
					</Labelled>
					<Labelled label="Fat">
						<TextInput
							type="number"
							inputMode="decimal"
							min={0}
							value={form.fatG}
							onChange={(e) => set("fatG", e.target.value)}
							placeholder="g"
						/>
					</Labelled>
				</div>

				<Labelled label="Category">
					<Select value={form.category} onChange={(e) => set("category", e.target.value)}>
						{FOOD_CATEGORIES.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</Select>
				</Labelled>
			</div>
		</Sheet>
	);
};
