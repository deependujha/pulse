"use client";

import { useEffect, useMemo, useState } from "react";
import { FiRepeat, FiSettings } from "react-icons/fi";
import { toast } from "sonner";
import { DateStrip } from "@/components/common/date-strip";
import { EmptyState, GhostButton, SectionTitle, Spinner } from "@/components/common/bits";
import { Sheet } from "@/components/common/sheet";
import { api, patchCache, refreshAll, useResource } from "@/lib/api";
import type { Bootstrap, Routine, SetLog, WorkoutDay } from "@/lib/types";
import type { TabProps } from "@/components/navigation_tabs/tracker_map";
import { ExerciseCard, SetDetailSheet } from "./exercise_card";
import { PlanManager } from "./plan_manager";

export const WorkoutTab = ({ date, onDateChange }: TabProps) => {
	const workoutKey = `/api/workout?date=${date}`;
	const day = useResource<WorkoutDay>(workoutKey);
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");

	const [planOpen, setPlanOpen] = useState(false);
	const [swapOpen, setSwapOpen] = useState(false);
	const [detailFor, setDetailFor] = useState<string | null>(null);
	// A swap only sticks once a set is logged against it, so hold it locally
	// until then.
	const [override, setOverride] = useState<Routine | null>(null);

	useEffect(() => setOverride(null), [date]);

	const routines = bootstrap.data?.routines ?? [];
	const routine = override ?? day.data?.routine ?? null;
	const logs = day.data?.logs;

	const logsByExercise = useMemo(() => {
		const map = new Map<string, SetLog[]>();
		for (const log of logs ?? []) {
			if (!log.exerciseId) continue;
			const list = map.get(log.exerciseId) ?? [];
			list.push(log);
			map.set(log.exerciseId, list);
		}
		return map;
	}, [logs]);

	const targetSets = routine?.items.reduce((sum, item) => sum + item.sets, 0) ?? 0;
	const doneSets = routine
		? routine.items.reduce(
				(sum, item) =>
					sum + Math.min(item.sets, logsByExercise.get(item.exerciseId)?.length ?? 0),
				0,
			)
		: 0;

	const toggleSet = async (
		exerciseId: string,
		setIndex: number,
		done: boolean,
		reps: number | null,
		weightKg: number | null,
	) => {
		if (!routine) return;

		// Optimistic: the pill should fill the instant it is tapped.
		patchCache<WorkoutDay>(workoutKey, (prev) => {
			if (!prev) return prev as unknown as WorkoutDay;
			const without = prev.logs.filter(
				(log) => !(log.exerciseId === exerciseId && log.setIndex === setIndex),
			);
			return {
				...prev,
				logs: done
					? [
							...without,
							{
								id: `optimistic-${exerciseId}-${setIndex}`,
								date,
								routineId: routine.id,
								exerciseId,
								exerciseName: "",
								setIndex,
								reps,
								weightKg,
							},
						]
					: without,
			};
		});

		try {
			if (done) {
				await api.post("/api/workout/sets", {
					date,
					routineId: routine.id,
					exerciseId,
					setIndex,
					reps,
					weightKg,
				});
			} else {
				await api.del(
					`/api/workout/sets?date=${date}&exerciseId=${exerciseId}&setIndex=${setIndex}`,
				);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save that set");
		} finally {
			await refreshAll(workoutKey, "/api/insights");
		}
	};

	const swapTo = (next: Routine | null) => {
		setOverride(next);
		setSwapOpen(false);
		if (next) toast.success(`Switched to ${next.name}`);
	};

	const detailItem = routine?.items.find((item) => item.id === detailFor) ?? null;

	return (
		<div className="space-y-4">
			<DateStrip value={date} onChange={onDateChange} />

			{day.loading ? (
				<Spinner label="Loading your workout" />
			) : (
				<>
					<section
						className="rounded-2xl border border-border p-4"
						style={routine ? { backgroundColor: `${routine.color}12` } : undefined}
					>
						<div className="flex items-center gap-3">
							<span
								className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl"
								style={{ backgroundColor: routine ? `${routine.color}26` : "var(--secondary)" }}
							>
								{routine?.emoji ?? "😴"}
							</span>
							<div className="min-w-0 flex-1">
								<h2 className="truncate text-lg font-semibold">
									{routine?.name ?? "Rest day"}
								</h2>
								<p className="truncate text-sm text-muted-foreground">
									{routine?.focus ?? "Nothing scheduled — recover well."}
								</p>
							</div>
						</div>

						{routine && targetSets > 0 && (
							<div className="mt-4">
								<div className="flex items-baseline justify-between text-xs text-muted-foreground">
									<span>
										{doneSets} of {targetSets} sets
									</span>
									<span>{Math.round((doneSets / targetSets) * 100)}%</span>
								</div>
								<div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
									<div
										className="h-full rounded-full transition-[width] duration-500"
										style={{
											width: `${Math.min(100, (doneSets / targetSets) * 100)}%`,
											backgroundColor: routine.color,
										}}
									/>
								</div>
							</div>
						)}

						<div className="mt-4 flex gap-2">
							<GhostButton
								className="flex flex-1 items-center justify-center gap-2"
								onClick={() => setSwapOpen(true)}
							>
								<FiRepeat size={14} />
								{routine ? "Swap" : "Pick a workout"}
							</GhostButton>
							<GhostButton
								className="flex flex-1 items-center justify-center gap-2"
								onClick={() => setPlanOpen(true)}
							>
								<FiSettings size={14} />
								Plan
							</GhostButton>
						</div>
					</section>

					{routine ? (
						routine.items.length === 0 ? (
							<EmptyState
								emoji="📝"
								title="This workout is empty"
								body="Add some movements to it from the plan editor."
								action={
									<GhostButton onClick={() => setPlanOpen(true)}>Edit workout</GhostButton>
								}
							/>
						) : (
							<div>
								<SectionTitle title="Exercises" caption="Tap a set to log it" />
								<ul className="space-y-2.5">
									{routine.items.map((item) => (
										<ExerciseCard
											key={item.id}
											item={item}
											logs={logsByExercise.get(item.exerciseId) ?? []}
											last={day.data?.lastPerformance?.[item.exerciseId] ?? null}
											accent={routine.color}
											onToggle={(setIndex, done, reps, weightKg) =>
												toggleSet(item.exerciseId, setIndex, done, reps, weightKg)
											}
											onDetail={() => setDetailFor(item.id)}
										/>
									))}
								</ul>
							</div>
						)
					) : (
						<EmptyState
							emoji="🌿"
							title="Rest day"
							body="Recovery is part of the plan. Want to move anyway? Pick a workout above."
						/>
					)}
				</>
			)}

			<SetDetailSheet
				open={Boolean(detailItem)}
				onClose={() => setDetailFor(null)}
				item={detailItem}
				date={date}
				routineId={routine?.id ?? ""}
				logs={detailItem ? (logsByExercise.get(detailItem.exerciseId) ?? []) : []}
				onSaved={() => refreshAll(workoutKey, "/api/insights")}
			/>

			<Sheet
				open={swapOpen}
				onClose={() => setSwapOpen(false)}
				title="Today's workout"
				subtitle="Swapping here only changes this day"
			>
				<ul className="space-y-2 pb-2">
					<li>
						<button
							type="button"
							onClick={() => swapTo(null)}
							className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:scale-[0.99]"
						>
							<span className="grid size-10 place-items-center rounded-xl bg-secondary text-lg">
								😴
							</span>
							<span className="text-sm font-medium">Rest day</span>
						</button>
					</li>
					{routines.map((option) => (
						<li key={option.id}>
							<button
								type="button"
								onClick={() => swapTo(option)}
								className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:scale-[0.99]"
							>
								<span
									className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
									style={{ backgroundColor: `${option.color}22` }}
								>
									{option.emoji}
								</span>
								<span className="min-w-0">
									<span className="block truncate text-sm font-medium">{option.name}</span>
									<span className="block truncate text-xs text-muted-foreground">
										{option.items.length} exercises
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			</Sheet>

			<PlanManager
				open={planOpen}
				onClose={() => setPlanOpen(false)}
				routines={routines}
				exercises={bootstrap.data?.exercises ?? []}
				schedule={bootstrap.data?.schedule ?? []}
			/>
		</div>
	);
};
