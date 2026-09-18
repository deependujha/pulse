"use client";

import { useState } from "react";
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Sheet } from "@/components/common/sheet";
import { Labelled, PrimaryButton, TextInput } from "@/components/common/bits";
import { ExercisePicker } from "./exercise_picker";
import { api, refreshAll, useAction } from "@/lib/api";
import type { Exercise, Routine } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLORS = [
	"#4a3aa7",
	"#2a78d6",
	"#1baf7a",
	"#eda100",
	"#eb6834",
	"#e34948",
	"#e87ba4",
	"#008300",
];

const EMOJIS = ["🏋️", "💪", "🦵", "🎣", "💥", "🏔️", "🧘", "🏃", "🤸", "🔥"];

type Draft = { exerciseId: string; sets: string; reps: string };

type Props = {
	open: boolean;
	onClose: () => void;
	routine: Routine | null;
	exercises: Exercise[];
};

/**
 * Build a reusable workout: name it, pick movements, set the sets and reps.
 * Mounted only while open and keyed on the routine, so the fields seed from props.
 */
export const RoutineEditor = (props: Props) => {
	if (!props.open) return null;
	return <RoutineForm key={props.routine?.id ?? "new"} {...props} />;
};

const RoutineForm = ({ open, onClose, routine, exercises }: Props) => {
	const [name, setName] = useState(routine?.name ?? "");
	const [focus, setFocus] = useState(routine?.focus ?? "");
	const [color, setColor] = useState(routine?.color ?? COLORS[0]);
	const [emoji, setEmoji] = useState(routine?.emoji ?? EMOJIS[0]);
	const [items, setItems] = useState<Draft[]>(
		() =>
			routine?.items.map((item) => ({
				exerciseId: item.exerciseId,
				sets: String(item.sets),
				reps: item.reps,
			})) ?? [],
	);
	const [picking, setPicking] = useState(false);
	const { pending, run } = useAction();

	const byId = new Map(exercises.map((e) => [e.id, e]));

	const applyPicked = (ids: string[]) => {
		setItems((prev) => {
			const kept = prev.filter((item) => ids.includes(item.exerciseId));
			const added = ids
				.filter((id) => !prev.some((item) => item.exerciseId === id))
				.map((id) => {
					const exercise = byId.get(id);
					return {
						exerciseId: id,
						sets: String(exercise?.defaultSets ?? 3),
						reps: exercise?.defaultReps ?? "8-12",
					};
				});
			return [...kept, ...added];
		});
	};

	const move = (index: number, delta: number) =>
		setItems((prev) => {
			const next = [...prev];
			const target = index + delta;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});

	const save = async () => {
		if (!name.trim()) {
			toast.error("Give the workout a name");
			return;
		}

		const body = {
			name: name.trim(),
			focus: focus.trim(),
			color,
			emoji,
			items: items.map((item) => ({
				exerciseId: item.exerciseId,
				sets: Number(item.sets) || 3,
				reps: item.reps.trim() || "8-12",
			})),
		};

		const result = await run(
			() =>
				routine
					? api.patch(`/api/routines/${routine.id}`, body)
					: api.post("/api/routines", body),
			(message) => toast.error(message),
		);

		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/routines", "/api/workout");
		toast.success(routine ? "Workout updated" : "Workout created");
		onClose();
	};

	const remove = async () => {
		if (!routine) return;
		const result = await run(
			() => api.del(`/api/routines/${routine.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/routines", "/api/workout", "/api/schedule");
		toast.success("Workout removed");
		onClose();
	};

	return (
		<>
			<Sheet
				open={open}
				onClose={onClose}
				title={routine ? "Edit workout" : "New workout"}
				subtitle={`${items.length} exercise${items.length === 1 ? "" : "s"}`}
				footer={
					<div className="space-y-2">
						<PrimaryButton onClick={save} disabled={pending}>
							{pending ? "Saving…" : routine ? "Save changes" : "Create workout"}
						</PrimaryButton>
						{routine && (
							<button
								type="button"
								onClick={remove}
								disabled={pending}
								className="h-10 w-full rounded-xl text-sm font-medium text-[var(--critical)] active:scale-[0.99]"
							>
								Delete workout
							</button>
						)}
					</div>
				}
			>
				<div className="space-y-4 pb-2">
					<Labelled label="Name">
						<TextInput
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Push Day"
							autoFocus={!routine}
						/>
					</Labelled>

					<Labelled label="Focus" hint="The one-line subtitle you'll see each morning">
						<TextInput
							value={focus}
							onChange={(e) => setFocus(e.target.value)}
							placeholder="Chest + Core"
						/>
					</Labelled>

					<div>
						<span className="mb-1.5 block text-sm font-medium">Icon</span>
						<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
							{EMOJIS.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => setEmoji(option)}
									aria-pressed={emoji === option}
									className={cn(
										"grid size-11 shrink-0 place-items-center rounded-xl border text-xl transition active:scale-95",
										emoji === option ? "border-foreground bg-secondary" : "border-border",
									)}
								>
									{option}
								</button>
							))}
						</div>
					</div>

					<div>
						<span className="mb-1.5 block text-sm font-medium">Colour</span>
						<div className="flex flex-wrap gap-2">
							{COLORS.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => setColor(option)}
									aria-label={`Colour ${option}`}
									aria-pressed={color === option}
									className={cn(
										"size-9 rounded-full transition active:scale-95",
										color === option && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
									)}
									style={{ backgroundColor: option }}
								/>
							))}
						</div>
					</div>

					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<span className="text-sm font-medium">Exercises</span>
							<button
								type="button"
								onClick={() => setPicking(true)}
								className="flex items-center gap-1 text-sm font-medium text-muted-foreground active:scale-95"
							>
								<FiPlus size={15} />
								Add
							</button>
						</div>

						{items.length === 0 ? (
							<button
								type="button"
								onClick={() => setPicking(true)}
								className="w-full rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground"
							>
								Pick movements for this workout
							</button>
						) : (
							<ul className="space-y-2">
								{items.map((item, index) => {
									const exercise = byId.get(item.exerciseId);
									return (
										<li
											key={item.exerciseId}
											className="rounded-xl border border-border p-3"
										>
											<div className="flex items-start gap-2">
												<span className="min-w-0 flex-1 truncate text-sm font-medium">
													{exercise?.name ?? "Removed exercise"}
												</span>
												<div className="flex shrink-0 gap-1">
													<IconBtn
														label="Move up"
														disabled={index === 0}
														onClick={() => move(index, -1)}
													>
														<FiArrowUp size={14} />
													</IconBtn>
													<IconBtn
														label="Move down"
														disabled={index === items.length - 1}
														onClick={() => move(index, 1)}
													>
														<FiArrowDown size={14} />
													</IconBtn>
													<IconBtn
														label="Remove"
														onClick={() =>
															setItems((prev) => prev.filter((_, i) => i !== index))
														}
													>
														<FiTrash2 size={14} />
													</IconBtn>
												</div>
											</div>

											<div className="mt-2 grid grid-cols-2 gap-2">
												<label className="block">
													<span className="mb-1 block text-[11px] text-muted-foreground">
														Sets
													</span>
													<TextInput
														type="number"
														inputMode="numeric"
														min={1}
														className="h-10"
														value={item.sets}
														onChange={(e) =>
															setItems((prev) =>
																prev.map((it, i) =>
																	i === index ? { ...it, sets: e.target.value } : it,
																),
															)
														}
													/>
												</label>
												<label className="block">
													<span className="mb-1 block text-[11px] text-muted-foreground">
														Reps
													</span>
													<TextInput
														className="h-10"
														value={item.reps}
														onChange={(e) =>
															setItems((prev) =>
																prev.map((it, i) =>
																	i === index ? { ...it, reps: e.target.value } : it,
																),
															)
														}
													/>
												</label>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			</Sheet>

			<ExercisePicker
				open={picking}
				onClose={() => setPicking(false)}
				exercises={exercises}
				selected={items.map((item) => item.exerciseId)}
				onConfirm={applyPicked}
			/>
		</>
	);
};

const IconBtn = ({
	label,
	children,
	...props
}: React.ComponentProps<"button"> & { label: string }) => (
	<button
		type="button"
		aria-label={label}
		className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition active:scale-95 disabled:opacity-30"
		{...props}
	>
		{children}
	</button>
);
