"use client";

import { useState } from "react";
import { FiChevronDown, FiEdit3, FiPlay } from "react-icons/fi";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import { PrimaryButton, TextInput } from "@/components/common/bits";
import { api, useAction } from "@/lib/api";
import { formatShort } from "@/lib/dates";
import type { RoutineItem, SetLog } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
	item: RoutineItem;
	logs: SetLog[];
	last: { date: string; reps: number | null; weightKg: number | null } | null;
	accent: string;
	onToggle: (setIndex: number, done: boolean, reps: number | null, weightKg: number | null) => void;
	onDetail: () => void;
};

const describeLoad = (reps: number | null, weightKg: number | null): string => {
	if (weightKg && reps) return `${trim(weightKg)}×${reps}`;
	if (weightKg) return `${trim(weightKg)}kg`;
	if (reps) return `${reps}`;
	return "✓";
};

const trim = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/**
 * One exercise for the day. A tap on a set pill logs it carrying forward the
 * last load used, so a normal working set is a single tap.
 */
export const ExerciseCard = ({
	item,
	logs,
	last,
	accent,
	onToggle,
	onDetail,
}: Props) => {
	const [expanded, setExpanded] = useState(false);
	const exercise = item.exercise;
	const byIndex = new Map(logs.map((log) => [log.setIndex, log]));
	const doneCount = logs.length;
	const complete = doneCount >= item.sets;

	// Carry forward whatever was last used — today's set first, else last session.
	const latestToday = [...logs].sort((a, b) => b.setIndex - a.setIndex)[0];
	const carry = latestToday ?? last ?? null;
	const media = exercise.gifUrl || exercise.imageUrl;

	return (
		<li
			className={cn(
				"rounded-2xl border bg-card transition",
				complete ? "border-transparent" : "border-border",
			)}
			style={complete ? { backgroundColor: `${accent}14`, borderColor: `${accent}55` } : undefined}
		>
			<div className="flex items-start gap-2 px-3.5 pt-3">
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					aria-expanded={expanded}
					className="min-w-0 flex-1 text-left"
				>
					<div className="flex items-center gap-1.5">
						<span className="truncate text-[15px] font-medium">{exercise.name}</span>
						<FiChevronDown
							size={14}
							className={cn(
								"shrink-0 text-muted-foreground transition-transform",
								expanded && "rotate-180",
							)}
						/>
					</div>
					<div className="mt-0.5 text-xs text-muted-foreground">
						{item.sets} × {item.reps}
						{last?.weightKg
							? ` · last ${trim(last.weightKg)} kg${last.reps ? ` × ${last.reps}` : ""} on ${formatShort(last.date)}`
							: ""}
					</div>
				</button>

				<button
					type="button"
					onClick={onDetail}
					aria-label={`Log weights for ${exercise.name}`}
					className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground active:scale-95"
				>
					<FiEdit3 size={14} />
				</button>
			</div>

			{expanded && (
				<div className="px-3.5 pt-3">
					{media && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={media}
							alt={`${exercise.name} demonstration`}
							className="mb-2 max-h-52 w-full rounded-xl border border-border object-cover"
							loading="lazy"
						/>
					)}
					{exercise.notes && (
						<p className="mb-2 text-sm text-muted-foreground">{exercise.notes}</p>
					)}
					{item.note && <p className="mb-2 text-sm text-muted-foreground">{item.note}</p>}
					{exercise.youtubeUrl && (
						<a
							href={exercise.youtubeUrl}
							target="_blank"
							rel="noreferrer"
							className="mb-1 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium"
						>
							<FiPlay size={14} />
							Watch the demo
						</a>
					)}
					{!media && !exercise.notes && !exercise.youtubeUrl && (
						<p className="mb-2 text-sm text-muted-foreground">
							No demo yet — add a video, image or GIF from the plan editor.
						</p>
					)}
				</div>
			)}

			<div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3.5 pt-3 pb-3.5">
				{Array.from({ length: item.sets }, (_, setIndex) => {
					const log = byIndex.get(setIndex);
					const isDone = Boolean(log);

					return (
						<button
							key={setIndex}
							type="button"
							aria-pressed={isDone}
							aria-label={`Set ${setIndex + 1}${isDone ? ", done" : ""}`}
							onClick={() =>
								onToggle(
									setIndex,
									!isDone,
									log?.reps ?? carry?.reps ?? null,
									log?.weightKg ?? carry?.weightKg ?? null,
								)
							}
							className={cn(
								"h-10 min-w-11 shrink-0 rounded-xl border px-2.5 text-sm font-medium transition active:scale-95",
								isDone ? "border-transparent text-white" : "border-border text-muted-foreground",
							)}
							style={isDone ? { backgroundColor: accent } : undefined}
						>
							{isDone ? describeLoad(log?.reps ?? null, log?.weightKg ?? null) : setIndex + 1}
						</button>
					);
				})}
			</div>
		</li>
	);
};

/** Per-set weight and reps, for when a single tap isn't enough. */
export const SetDetailScreen = ({
	open,
	onClose,
	item,
	date,
	routineId,
	logs,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	item: RoutineItem | null;
	date: string;
	routineId: string;
	logs: SetLog[];
	onSaved: () => void;
}) => {
	const { pending, run } = useAction();
	const [draft, setDraft] = useState<Record<number, { reps: string; weight: string }>>({});

	const seed = () => {
		if (!item) return {};
		const byIndex = new Map(logs.map((log) => [log.setIndex, log]));
		return Object.fromEntries(
			Array.from({ length: item.sets }, (_, i) => {
				const log = byIndex.get(i);
				return [i, { reps: log?.reps ? String(log.reps) : "", weight: log?.weightKg ? String(log.weightKg) : "" }];
			}),
		);
	};

	// Re-seed whenever a different exercise opens the sheet.
	const [seededFor, setSeededFor] = useState<string | null>(null);
	if (open && item && seededFor !== `${item.id}:${date}`) {
		setSeededFor(`${item.id}:${date}`);
		setDraft(seed());
	}
	if (!open && seededFor !== null) setSeededFor(null);

	if (!item) return null;

	const save = async () => {
		const result = await run(async () => {
			for (const [indexKey, value] of Object.entries(draft)) {
				const setIndex = Number(indexKey);
				const reps = value.reps.trim();
				const weight = value.weight.trim();

				if (!reps && !weight) {
					await api.del(
						`/api/workout/sets?date=${date}&exerciseId=${item.exerciseId}&setIndex=${setIndex}`,
					);
					continue;
				}

				await api.post("/api/workout/sets", {
					date,
					routineId,
					exerciseId: item.exerciseId,
					setIndex,
					reps: reps ? Number(reps) : null,
					weightKg: weight ? Number(weight) : null,
				});
			}
			return true;
		}, (message) => toast.error(message));

		if (!result) return;
		onSaved();
		onClose();
	};

	return (
		<Screen
			open={open}
			onClose={onClose}
			title={item.exercise.name}
			subtitle={`Target ${item.sets} × ${item.reps} — leave a set blank to clear it`}
			footer={
				<PrimaryButton onClick={save} disabled={pending}>
					{pending ? "Saving…" : "Save sets"}
				</PrimaryButton>
			}
		>
			<ul className="space-y-2 pb-2">
				{Array.from({ length: item.sets }, (_, setIndex) => (
					<li key={setIndex} className="flex items-center gap-2">
						<span className="w-12 shrink-0 text-sm text-muted-foreground">
							Set {setIndex + 1}
						</span>
						<TextInput
							type="number"
							inputMode="decimal"
							placeholder="kg"
							className="h-11 flex-1"
							value={draft[setIndex]?.weight ?? ""}
							onChange={(e) =>
								setDraft((prev) => ({
									...prev,
									[setIndex]: { reps: prev[setIndex]?.reps ?? "", weight: e.target.value },
								}))
							}
						/>
						<span className="text-sm text-muted-foreground">×</span>
						<TextInput
							type="number"
							inputMode="numeric"
							placeholder="reps"
							className="h-11 flex-1"
							value={draft[setIndex]?.reps ?? ""}
							onChange={(e) =>
								setDraft((prev) => ({
									...prev,
									[setIndex]: { weight: prev[setIndex]?.weight ?? "", reps: e.target.value },
								}))
							}
						/>
					</li>
				))}
			</ul>
		</Screen>
	);
};
