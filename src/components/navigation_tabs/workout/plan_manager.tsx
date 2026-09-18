"use client";

import { useState } from "react";
import { FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Sheet } from "@/components/common/sheet";
import { GhostButton, SegmentedControl, Select } from "@/components/common/bits";
import { ExerciseEditor } from "./exercise_editor";
import { RoutineEditor } from "./routine_editor";
import { api, refreshAll, useAction } from "@/lib/api";
import { WEEKDAY_LONG } from "@/lib/dates";
import type { Exercise, Routine, ScheduleSlot } from "@/lib/types";

type Props = {
	open: boolean;
	onClose: () => void;
	routines: Routine[];
	exercises: Exercise[];
	schedule: ScheduleSlot[];
};

type Pane = "week" | "workouts" | "library";

/** One place to shape the plan: the week, the workouts, the movement library. */
export const PlanManager = ({ open, onClose, routines, exercises, schedule }: Props) => {
	const [pane, setPane] = useState<Pane>("week");
	const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
	const [routineOpen, setRoutineOpen] = useState(false);
	const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
	const [exerciseOpen, setExerciseOpen] = useState(false);
	const { run } = useAction();

	const assign = async (weekday: number, routineId: string) => {
		const result = await run(
			() => api.put("/api/schedule", { weekday, routineId: routineId || null }),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/schedule", "/api/workout");
	};

	const deleteExercise = async (exercise: Exercise) => {
		const result = await run(
			() => api.del(`/api/exercises/${exercise.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/exercises", "/api/routines", "/api/workout");
		toast.success(`Removed ${exercise.name}`);
	};

	return (
		<>
			<Sheet open={open} onClose={onClose} title="Your plan">
				<div className="sticky top-0 z-10 bg-background pb-3">
					<SegmentedControl
						value={pane}
						onChange={setPane}
						options={[
							{ id: "week", label: "Week" },
							{ id: "workouts", label: "Workouts" },
							{ id: "library", label: "Library" },
						]}
					/>
				</div>

				{pane === "week" && (
					<ul className="space-y-2 pb-2">
						{WEEKDAY_LONG.map((day, weekday) => (
							<li
								key={day}
								className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
							>
								<span className="w-24 shrink-0 text-sm font-medium">{day}</span>
								<Select
									className="h-10"
									value={schedule.find((s) => s.weekday === weekday)?.routineId ?? ""}
									onChange={(e) => assign(weekday, e.target.value)}
								>
									<option value="">Rest day</option>
									{routines.map((routine) => (
										<option key={routine.id} value={routine.id}>
											{routine.emoji} {routine.name}
										</option>
									))}
								</Select>
							</li>
						))}
					</ul>
				)}

				{pane === "workouts" && (
					<div className="space-y-2 pb-2">
						<GhostButton
							className="flex w-full items-center justify-center gap-2"
							onClick={() => {
								setEditingRoutine(null);
								setRoutineOpen(true);
							}}
						>
							<FiPlus size={15} />
							New workout
						</GhostButton>

						{routines.map((routine) => (
							<button
								key={routine.id}
								type="button"
								onClick={() => {
									setEditingRoutine(routine);
									setRoutineOpen(true);
								}}
								className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:scale-[0.99]"
							>
								<span
									className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
									style={{ backgroundColor: `${routine.color}22` }}
								>
									{routine.emoji}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-medium">{routine.name}</span>
									<span className="block truncate text-xs text-muted-foreground">
										{routine.items.length} exercises
										{routine.focus ? ` · ${routine.focus}` : ""}
									</span>
								</span>
								<FiChevronRight size={16} className="shrink-0 text-muted-foreground" />
							</button>
						))}

						{routines.length === 0 && (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No workouts yet. Create your first one above.
							</p>
						)}
					</div>
				)}

				{pane === "library" && (
					<div className="space-y-2 pb-2">
						<GhostButton
							className="flex w-full items-center justify-center gap-2"
							onClick={() => {
								setEditingExercise(null);
								setExerciseOpen(true);
							}}
						>
							<FiPlus size={15} />
							New exercise
						</GhostButton>

						{exercises.map((exercise) => (
							<div
								key={exercise.id}
								className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5"
							>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">{exercise.name}</div>
									<div className="truncate text-xs text-muted-foreground">
										{exercise.muscleGroup} · {exercise.defaultSets} × {exercise.defaultReps}
									</div>
								</div>
								<button
									type="button"
									aria-label={`Edit ${exercise.name}`}
									onClick={() => {
										setEditingExercise(exercise);
										setExerciseOpen(true);
									}}
									className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground active:scale-95"
								>
									<FiEdit2 size={14} />
								</button>
								<button
									type="button"
									aria-label={`Delete ${exercise.name}`}
									onClick={() => deleteExercise(exercise)}
									className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-[var(--critical)] active:scale-95"
								>
									<FiTrash2 size={14} />
								</button>
							</div>
						))}
					</div>
				)}
			</Sheet>

			<RoutineEditor
				open={routineOpen}
				onClose={() => setRoutineOpen(false)}
				routine={editingRoutine}
				exercises={exercises}
			/>

			<ExerciseEditor
				open={exerciseOpen}
				onClose={() => setExerciseOpen(false)}
				exercise={editingExercise}
			/>
		</>
	);
};
