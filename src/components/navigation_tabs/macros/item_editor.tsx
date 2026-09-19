"use client";

import { useState } from "react";
import { FiStar } from "react-icons/fi";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import { Labelled, PrimaryButton, TextInput } from "@/components/common/bits";
import { api, refreshAll, useAction } from "@/lib/api";
import type { LibraryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMOJIS = ["🍽️", "🫓", "🍚", "🍲", "🥘", "🧀", "🥚", "🍗", "🐟", "🥗", "🥤", "🥛", "🥣", "🍌", "🥜", "☕", "🍿", "🍩"];

const blank = {
	name: "",
	emoji: "🍽️",
	servingLabel: "1 serving",
	calories: "",
	proteinG: "",
	carbsG: "",
	fatG: "",
	favorite: false,
};

type Props = {
	open: boolean;
	onClose: () => void;
	item: LibraryItem | null;
	/** Pre-fill from a one-off the user is promoting into the library. */
	preset?: Partial<typeof blank>;
};

/**
 * Create or edit a library item. Everything is per one serving.
 * Mounted only while open and keyed on the item, so the fields seed from props.
 */
export const ItemEditor = (props: Props) => {
	if (!props.open) return null;
	return <ItemForm key={props.item?.id ?? "new"} {...props} />;
};

const ItemForm = ({ open, onClose, item, preset }: Props) => {
	const [form, setForm] = useState(() =>
		item
			? {
					name: item.name,
					emoji: item.emoji,
					servingLabel: item.servingLabel,
					calories: String(item.calories),
					proteinG: String(item.proteinG),
					carbsG: String(item.carbsG),
					fatG: String(item.fatG),
					favorite: item.favorite,
				}
			: { ...blank, ...preset },
	);
	const { pending, run } = useAction();

	const set = <K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	// Live check: macros should roughly account for the calories claimed.
	const macroKcal =
		(Number(form.proteinG) || 0) * 4 + (Number(form.carbsG) || 0) * 4 + (Number(form.fatG) || 0) * 9;
	const stated = Number(form.calories) || 0;
	const mismatch = stated > 0 && macroKcal > 0 && Math.abs(macroKcal - stated) > stated * 0.25;

	const save = async () => {
		if (!form.name.trim()) {
			toast.error("Give it a name");
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
			favorite: form.favorite,
		};

		const result = await run(
			() => (item ? api.patch(`/api/library/${item.id}`, body) : api.post("/api/library", body)),
			(message) => toast.error(message),
		);

		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/library");
		toast.success(item ? "Updated" : `${form.emoji} ${body.name} added`);
		onClose();
	};

	const remove = async () => {
		if (!item) return;
		const result = await run(
			() => api.del(`/api/library/${item.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/library");
		toast.success(`Removed ${item.name}`);
		onClose();
	};

	return (
		<Screen
			open={open}
			onClose={onClose}
			title={item ? "Edit item" : "New item"}
			subtitle="Every number is per one serving"
			footer={
				<div className="space-y-2">
					<PrimaryButton onClick={save} disabled={pending}>
						{pending ? "Saving…" : item ? "Save changes" : "Add to library"}
					</PrimaryButton>
					{item && (
						<button
							type="button"
							onClick={remove}
							disabled={pending}
							className="h-10 w-full rounded-xl text-sm font-medium text-[var(--critical)] active:scale-[0.99]"
						>
							Remove from library
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
						autoFocus={!item}
					/>
				</Labelled>

				<div>
					<span className="mb-1.5 block text-sm font-medium">Icon</span>
					<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
						{EMOJIS.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => set("emoji", option)}
								aria-pressed={form.emoji === option}
								className={cn(
									"grid size-11 shrink-0 place-items-center rounded-xl border text-xl transition active:scale-95",
									form.emoji === option ? "border-foreground bg-secondary" : "border-border",
								)}
							>
								{option}
							</button>
						))}
					</div>
				</div>

				<Labelled label="One serving is" hint="Whatever you'll actually measure by">
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

				<div>
					<div className="grid grid-cols-3 gap-2">
						<Labelled label="Protein (g)">
							<TextInput
								type="number"
								inputMode="decimal"
								min={0}
								value={form.proteinG}
								onChange={(e) => set("proteinG", e.target.value)}
								placeholder="0"
							/>
						</Labelled>
						<Labelled label="Carbs (g)">
							<TextInput
								type="number"
								inputMode="decimal"
								min={0}
								value={form.carbsG}
								onChange={(e) => set("carbsG", e.target.value)}
								placeholder="0"
							/>
						</Labelled>
						<Labelled label="Fat (g)">
							<TextInput
								type="number"
								inputMode="decimal"
								min={0}
								value={form.fatG}
								onChange={(e) => set("fatG", e.target.value)}
								placeholder="0"
							/>
						</Labelled>
					</div>
					{mismatch && (
						<p className="mt-1.5 text-xs text-[var(--warning)]">
							Those macros work out to about {Math.round(macroKcal)} kcal, not {stated}. Worth a
							second look — though rounding on packets does drift.
						</p>
					)}
				</div>

				<button
					type="button"
					onClick={() => set("favorite", !form.favorite)}
					aria-pressed={form.favorite}
					className={cn(
						"flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left transition active:scale-[0.99]",
						form.favorite ? "border-foreground bg-secondary" : "border-border",
					)}
				>
					<FiStar
						size={17}
						className={cn("shrink-0", form.favorite && "fill-current text-[var(--warning)]")}
					/>
					<span className="text-sm">
						Pin to the top of my library
						<span className="block text-xs text-muted-foreground">
							For the handful you log most days
						</span>
					</span>
				</button>
			</div>
		</Screen>
	);
};
