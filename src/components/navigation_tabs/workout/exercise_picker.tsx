"use client";

import { useMemo, useState } from "react";
import { FiCheck, FiPlus, FiSearch } from "react-icons/fi";
import { Sheet } from "@/components/common/sheet";
import { PrimaryButton, TextInput } from "@/components/common/bits";
import { ExerciseEditor } from "./exercise_editor";
import type { Exercise } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	exercises: Exercise[];
	/** Ids already in the routine — shown ticked and toggled off on tap. */
	selected: string[];
	onConfirm: (ids: string[]) => void;
};

/** Multi-select over the movement library, with an escape hatch to create one. */
export const ExercisePicker = ({ open, onClose, exercises, selected, onConfirm }: Props) => {
	const [query, setQuery] = useState("");
	const [picked, setPicked] = useState<string[]>(selected);
	const [creating, setCreating] = useState(false);

	const grouped = useMemo(() => {
		const q = query.trim().toLowerCase();
		const matches = q
			? exercises.filter(
					(e) =>
						e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q),
				)
			: exercises;

		const map = new Map<string, Exercise[]>();
		for (const exercise of matches) {
			const list = map.get(exercise.muscleGroup) ?? [];
			list.push(exercise);
			map.set(exercise.muscleGroup, list);
		}
		return [...map.entries()];
	}, [exercises, query]);

	const toggle = (id: string) =>
		setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	return (
		<>
			<Sheet
				open={open}
				onClose={onClose}
				title="Add exercises"
				subtitle={`${picked.length} selected`}
				footer={
					<PrimaryButton
						onClick={() => {
							onConfirm(picked);
							onClose();
						}}
					>
						Done
					</PrimaryButton>
				}
			>
				<div className="sticky top-0 z-10 bg-background pb-2">
					<div className="relative">
						<FiSearch
							size={16}
							className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
						/>
						<TextInput
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search movements"
							className="pl-9"
						/>
					</div>
					<button
						type="button"
						onClick={() => setCreating(true)}
						className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium active:scale-[0.99]"
					>
						<FiPlus size={15} />
						New exercise
					</button>
				</div>

				<div className="space-y-4 pb-2">
					{grouped.map(([group, list]) => (
						<div key={group}>
							<h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
								{group}
							</h3>
							<ul className="space-y-1.5">
								{list.map((exercise) => {
									const isPicked = picked.includes(exercise.id);
									return (
										<li key={exercise.id}>
											<button
												type="button"
												onClick={() => toggle(exercise.id)}
												aria-pressed={isPicked}
												className={cn(
													"flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition active:scale-[0.99]",
													isPicked ? "border-foreground bg-secondary" : "border-border",
												)}
											>
												<span
													className={cn(
														"grid size-6 shrink-0 place-items-center rounded-full border",
														isPicked
															? "border-foreground bg-foreground text-background"
															: "border-border",
													)}
												>
													{isPicked && <FiCheck size={13} />}
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium">
														{exercise.name}
													</span>
													<span className="block text-xs text-muted-foreground">
														{exercise.defaultSets} × {exercise.defaultReps}
													</span>
												</span>
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					))}

					{grouped.length === 0 && (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Nothing matches “{query}”.
						</p>
					)}
				</div>
			</Sheet>

			<ExerciseEditor
				open={creating}
				onClose={() => setCreating(false)}
				exercise={null}
				onSaved={(created) => setPicked((prev) => [...prev, created.id])}
			/>
		</>
	);
};
