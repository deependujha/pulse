"use client";

import { useMemo, useState } from "react";
import { FiEdit2, FiMinus, FiPlus, FiSearch, FiStar } from "react-icons/fi";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import {
	GhostButton,
	Labelled,
	PrimaryButton,
	SegmentedControl,
	TextInput,
} from "@/components/common/bits";
import { ItemEditor } from "./item_editor";
import { api, refreshAll, useAction } from "@/lib/api";
import { MEAL_TYPES, type LibraryItem, type MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	date: string;
	library: LibraryItem[];
	defaultMeal: MealType;
	onLogged: () => void;
};

type Mode = "library" | "oneoff";

/**
 * The one place you log: pick from your library and set the servings, or type
 * a one-off. Tapping a row expands it in place — the servings stepper and the
 * confirm button land under your finger rather than in a footer.
 */
export const LogScreen = ({ open, onClose, date, library, defaultMeal, onLogged }: Props) => {
	const [mode, setMode] = useState<Mode>("library");
	const [meal, setMeal] = useState<MealType>(defaultMeal);
	const [query, setQuery] = useState("");
	const [openId, setOpenId] = useState<string | null>(null);
	const [servings, setServings] = useState(1);

	const [custom, setCustom] = useState({
		name: "",
		calories: "",
		proteinG: "",
		carbsG: "",
		fatG: "",
		fiberG: "",
		save: false,
	});

	const [editorItem, setEditorItem] = useState<LibraryItem | null>(null);
	const [editorOpen, setEditorOpen] = useState(false);

	const { pending, run } = useAction();

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return library;
		return library.filter((item) => item.name.toLowerCase().includes(q));
	}, [library, query]);

	const reset = () => {
		setOpenId(null);
		setServings(1);
		setQuery("");
		setCustom({ name: "", calories: "", proteinG: "", carbsG: "", fatG: "", fiberG: "", save: false });
	};

	const logItem = async (item: LibraryItem, count: number) => {
		const result = await run(
			() => api.post("/api/meals", { date, itemId: item.id, meal, servings: count }),
			(message) => toast.error(message),
		);
		if (!result) return;
		toast.success(`${item.emoji} ${item.name} · ${Math.round(item.calories * count)} kcal`);
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
					carbsG: Number(custom.carbsG) || 0,
					fatG: Number(custom.fatG) || 0,
					fiberG: Number(custom.fiberG) || 0,
					servings: 1,
					saveToLibrary: custom.save,
				}),
			(message) => toast.error(message),
		);

		if (!result) return;
		toast.success(`${custom.name.trim()} logged`);
		if (custom.save) await refreshAll("/api/bootstrap", "/api/library");
		reset();
		onLogged();
		onClose();
	};

	const newItem = () => {
		setEditorItem(null);
		setEditorOpen(true);
	};

	return (
		<>
			<Screen
				open={open}
				onClose={onClose}
				title="Log it"
				subtitle={MEAL_TYPES.find((m) => m.id === meal)?.label}
				footer={
					mode === "oneoff" ? (
						<PrimaryButton onClick={logCustom} disabled={pending}>
							{pending ? "Logging…" : "Log it"}
						</PrimaryButton>
					) : undefined
				}
			>
				<div className="sticky top-0 z-10 space-y-3 bg-background pb-3">
					<SegmentedControl
						value={mode}
						onChange={(next) => setMode(next)}
						options={[
							{ id: "library", label: "My library" },
							{ id: "oneoff", label: "One-off" },
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

				{mode === "library" ? (
					<div className="space-y-3 pb-2">
						{library.length === 0 ? (
							<div className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
								<div className="text-3xl">📖</div>
								<p className="text-sm font-medium">Your library is empty</p>
								<p className="text-xs text-muted-foreground">
									Add the things you actually eat, once, with your own portions. After that
									they&rsquo;re a tap away.
								</p>
								<GhostButton
									className="mx-auto flex items-center justify-center gap-2"
									onClick={newItem}
								>
									<FiPlus size={15} />
									Add your first item
								</GhostButton>
							</div>
						) : (
							<>
								{library.length > 6 && (
									<div className="relative">
										<FiSearch
											size={16}
											className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
										/>
										<TextInput
											value={query}
											onChange={(e) => setQuery(e.target.value)}
											placeholder="Search your library"
											className="pl-9"
										/>
									</div>
								)}

								<ul className="space-y-1.5">
									{matches.map((item) => {
										const active = openId === item.id;
										return (
											<li
												key={item.id}
												className={cn(
													"overflow-hidden rounded-xl border transition",
													active ? "border-foreground bg-secondary" : "border-border",
												)}
											>
												<div className="flex items-center gap-2 pr-2">
													<button
														type="button"
														onClick={() => {
															setOpenId(active ? null : item.id);
															setServings(1);
														}}
														aria-expanded={active}
														className="flex min-h-13 flex-1 items-center gap-3 px-3 py-2 text-left"
													>
														<span className="text-lg">{item.emoji}</span>
														<span className="min-w-0 flex-1">
															<span className="flex items-center gap-1.5">
																<span className="truncate text-sm font-medium">{item.name}</span>
																{item.favorite && (
																	<FiStar
																		size={11}
																		className="shrink-0 fill-current text-[var(--warning)]"
																	/>
																)}
															</span>
															<span className="block truncate text-xs text-muted-foreground">
																{item.calories} kcal · {item.servingLabel}
															</span>
														</span>
													</button>
													<button
														type="button"
														aria-label={`Edit ${item.name}`}
														onClick={() => {
															setEditorItem(item);
															setEditorOpen(true);
														}}
														className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground active:scale-95"
													>
														<FiEdit2 size={14} />
													</button>
												</div>

												{active && (
													<div className="space-y-2.5 border-t border-border px-3 py-3">
														<div className="flex items-center justify-between gap-3">
															<span className="text-sm text-muted-foreground">Servings</span>
															<div className="flex items-center gap-2">
																<StepButton
																	label="Fewer servings"
																	onClick={() =>
																		setServings((v) =>
																			Math.max(0.25, Math.round((v - 0.25) * 100) / 100),
																		)
																	}
																>
																	<FiMinus size={15} />
																</StepButton>
																<span className="w-12 text-center text-base font-semibold tabular-nums">
																	{servings}
																</span>
																<StepButton
																	label="More servings"
																	onClick={() =>
																		setServings((v) => Math.round((v + 0.25) * 100) / 100)
																	}
																>
																	<FiPlus size={15} />
																</StepButton>
															</div>
														</div>

														<PrimaryButton
															onClick={() => logItem(item, servings)}
															disabled={pending}
														>
															{pending
																? "Logging…"
																: `Log ${Math.round(item.calories * servings)} kcal`}
														</PrimaryButton>
													</div>
												)}
											</li>
										);
									})}
								</ul>

								{matches.length === 0 && (
									<p className="py-6 text-center text-sm text-muted-foreground">
										Nothing matches &ldquo;{query}&rdquo;.
									</p>
								)}

								<GhostButton
									className="flex w-full items-center justify-center gap-2"
									onClick={newItem}
								>
									<FiPlus size={15} />
									New library item
								</GhostButton>
							</>
						)}
					</div>
				) : (
					<div className="space-y-4 pb-2">
						<p className="text-sm text-muted-foreground">
							For the street samosa you&rsquo;ll never log twice. Estimate it and move on.
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

						<div className="grid grid-cols-2 gap-2">
							<Labelled label="Protein (g)">
								<TextInput
									type="number"
									inputMode="decimal"
									min={0}
									value={custom.proteinG}
									onChange={(e) => setCustom((p) => ({ ...p, proteinG: e.target.value }))}
									placeholder="0"
								/>
							</Labelled>
							<Labelled label="Carbs (g)">
								<TextInput
									type="number"
									inputMode="decimal"
									min={0}
									value={custom.carbsG}
									onChange={(e) => setCustom((p) => ({ ...p, carbsG: e.target.value }))}
									placeholder="0"
								/>
							</Labelled>
							<Labelled label="Fat (g)">
								<TextInput
									type="number"
									inputMode="decimal"
									min={0}
									value={custom.fatG}
									onChange={(e) => setCustom((p) => ({ ...p, fatG: e.target.value }))}
									placeholder="0"
								/>
							</Labelled>
							<Labelled label="Fiber (g)">
								<TextInput
									type="number"
									inputMode="decimal"
									min={0}
									value={custom.fiberG}
									onChange={(e) => setCustom((p) => ({ ...p, fiberG: e.target.value }))}
									placeholder="0"
								/>
							</Labelled>
						</div>
						<p className="-mt-2 text-xs text-muted-foreground">
							Macros are optional &mdash; leave them blank if you&rsquo;re only counting calories.
						</p>

						<label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3">
							<input
								type="checkbox"
								checked={custom.save}
								onChange={(e) => setCustom((p) => ({ ...p, save: e.target.checked }))}
								className="size-5 accent-[var(--foreground)]"
							/>
							<span className="text-sm">Also add it to my library</span>
						</label>
					</div>
				)}
			</Screen>

			<ItemEditor open={editorOpen} onClose={() => setEditorOpen(false)} item={editorItem} />
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
