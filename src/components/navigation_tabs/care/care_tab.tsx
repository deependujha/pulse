"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiMoon, FiPlus, FiSun } from "react-icons/fi";
import { toast } from "sonner";
import { DateStrip } from "@/components/common/date-strip";
import {
	EmptyState,
	GhostButton,
	SectionTitle,
	SegmentedControl,
	Spinner,
} from "@/components/common/bits";
import { Sheet } from "@/components/common/sheet";
import { CareStepEditor } from "./care_step_editor";
import { api, patchCache, refreshAll, useResource } from "@/lib/api";
import { describeFrequency, isStepDue } from "@/lib/care";
import type { Bootstrap, CareStep } from "@/lib/types";
import type { TabProps } from "@/components/navigation_tabs/tracker_map";
import { cn } from "@/lib/utils";

type CareLogResponse = { date: string; doneStepIds: string[] };

export const CareTab = ({ date, onDateChange }: TabProps) => {
	const logKey = `/api/care/log?date=${date}`;
	const log = useResource<CareLogResponse>(logKey);
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");

	const [phase, setPhase] = useState<"AM" | "PM">(() =>
		new Date().getHours() < 12 ? "AM" : "PM",
	);
	const [manageOpen, setManageOpen] = useState(false);
	const [editorStep, setEditorStep] = useState<CareStep | null>(null);
	const [editorOpen, setEditorOpen] = useState(false);

	// Re-read the clock when the day changes back to today.
	useEffect(() => {
		setPhase(new Date().getHours() < 12 ? "AM" : "PM");
	}, [date]);

	const steps = bootstrap.data?.careSteps ?? [];
	const done = new Set(log.data?.doneStepIds ?? []);

	const { due, notToday } = useMemo(() => {
		const phaseSteps = steps.filter((step) => step.phase === phase);
		return {
			due: phaseSteps.filter((step) => isStepDue(step, date)),
			notToday: phaseSteps.filter((step) => !isStepDue(step, date)),
		};
	}, [steps, phase, date]);

	const doneCount = due.filter((step) => done.has(step.id)).length;

	const toggle = async (step: CareStep) => {
		const nextDone = !done.has(step.id);

		patchCache<CareLogResponse>(logKey, (prev) => {
			const ids = prev?.doneStepIds ?? [];
			return {
				date,
				doneStepIds: nextDone ? [...ids, step.id] : ids.filter((id) => id !== step.id),
			};
		});

		try {
			await api.post("/api/care/log", { date, stepId: step.id, done: nextDone });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save that");
		} finally {
			await refreshAll(logKey, "/api/insights");
		}
	};

	const openEditor = (step: CareStep | null) => {
		setEditorStep(step);
		setEditorOpen(true);
	};

	return (
		<div className="space-y-4">
			<DateStrip value={date} onChange={onDateChange} />

			<SegmentedControl
				value={phase}
				onChange={setPhase}
				options={[
					{ id: "AM", label: "Morning" },
					{ id: "PM", label: "Night" },
				]}
			/>

			{log.loading ? (
				<Spinner label="Loading your routine" />
			) : (
				<>
					<section className="rounded-2xl border border-border bg-card p-4">
						<div className="flex items-center gap-3">
							<span
								className="grid size-11 shrink-0 place-items-center rounded-2xl"
								style={{ backgroundColor: "color-mix(in oklab, var(--accent-care) 16%, transparent)" }}
							>
								{phase === "AM" ? (
									<FiSun size={20} style={{ color: "var(--accent-care)" }} />
								) : (
									<FiMoon size={20} style={{ color: "var(--accent-care)" }} />
								)}
							</span>
							<div className="min-w-0 flex-1">
								<h2 className="text-base font-semibold">
									{phase === "AM" ? "Morning routine" : "Night routine"}
								</h2>
								<p className="text-sm text-muted-foreground">
									{due.length === 0
										? "Nothing due"
										: doneCount === due.length
											? "All done — nice."
											: `${doneCount} of ${due.length} steps`}
								</p>
							</div>
						</div>

						{due.length > 0 && (
							<div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
								<div
									className="h-full rounded-full transition-[width] duration-500"
									style={{
										width: `${(doneCount / due.length) * 100}%`,
										backgroundColor: "var(--accent-care)",
									}}
								/>
							</div>
						)}
					</section>

					{due.length === 0 ? (
						<EmptyState
							emoji="🌱"
							title="Nothing scheduled"
							body={`No ${phase === "AM" ? "morning" : "night"} steps are due today.`}
							action={<GhostButton onClick={() => openEditor(null)}>Add a step</GhostButton>}
						/>
					) : (
						<ul className="space-y-2">
							{due.map((step) => {
								const isDone = done.has(step.id);
								return (
									<li key={step.id}>
										<button
											type="button"
											aria-pressed={isDone}
											onClick={() => toggle(step)}
											className={cn(
												"flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.99]",
												isDone ? "border-transparent" : "border-border bg-card",
											)}
											style={
												isDone
													? {
															backgroundColor:
																"color-mix(in oklab, var(--accent-care) 12%, transparent)",
															borderColor:
																"color-mix(in oklab, var(--accent-care) 45%, transparent)",
														}
													: undefined
											}
										>
											<span
												className={cn(
													"grid size-7 shrink-0 place-items-center rounded-full border transition",
													isDone ? "border-transparent text-white" : "border-border",
												)}
												style={isDone ? { backgroundColor: "var(--accent-care)" } : undefined}
											>
												{isDone ? <FiCheck size={15} /> : <span className="text-sm">{step.emoji}</span>}
											</span>

											<span className="min-w-0 flex-1">
												<span
													className={cn(
														"block truncate text-[15px] font-medium",
														isDone && "line-through opacity-60",
													)}
												>
													{step.name}
												</span>
												{(step.note || step.product) && (
													<span className="block truncate text-xs text-muted-foreground">
														{step.product ? `${step.product}` : ""}
														{step.product && step.note ? " · " : ""}
														{step.note ?? ""}
													</span>
												)}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					)}

					{notToday.length > 0 && (
						<details className="rounded-2xl border border-border bg-card px-3.5 py-3">
							<summary className="cursor-pointer text-sm text-muted-foreground">
								{notToday.length} step{notToday.length === 1 ? "" : "s"} not due today
							</summary>
							<ul className="mt-2 space-y-1.5">
								{notToday.map((step) => (
									<li key={step.id} className="flex items-center gap-2 text-sm opacity-60">
										<span>{step.emoji}</span>
										<span className="min-w-0 flex-1 truncate">{step.name}</span>
										<span className="shrink-0 text-xs text-muted-foreground">
											{describeFrequency(step)}
										</span>
									</li>
								))}
							</ul>
						</details>
					)}

					<GhostButton
						className="flex w-full items-center justify-center gap-2"
						onClick={() => setManageOpen(true)}
					>
						<FiEdit2 size={14} />
						Edit routine
					</GhostButton>
				</>
			)}

			<Sheet
				open={manageOpen}
				onClose={() => setManageOpen(false)}
				title="Your care routine"
				subtitle="Steps, products and how often each one is due"
			>
				<div className="space-y-4 pb-2">
					<GhostButton
						className="flex w-full items-center justify-center gap-2"
						onClick={() => openEditor(null)}
					>
						<FiPlus size={15} />
						New step
					</GhostButton>

					{(["AM", "PM"] as const).map((group) => (
						<div key={group}>
							<SectionTitle title={group === "AM" ? "Morning" : "Night"} />
							<ul className="space-y-1.5">
								{steps
									.filter((step) => step.phase === group)
									.map((step) => (
										<li key={step.id}>
											<button
												type="button"
												onClick={() => openEditor(step)}
												className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left active:scale-[0.99]"
											>
												<span className="text-lg">{step.emoji}</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium">{step.name}</span>
													<span className="block truncate text-xs text-muted-foreground">
														{describeFrequency(step)}
														{step.product ? ` · ${step.product}` : ""}
													</span>
												</span>
												<FiEdit2 size={14} className="shrink-0 text-muted-foreground" />
											</button>
										</li>
									))}
							</ul>
							{steps.filter((step) => step.phase === group).length === 0 && (
								<p className="py-3 text-sm text-muted-foreground">No steps yet.</p>
							)}
						</div>
					))}
				</div>
			</Sheet>

			<CareStepEditor
				open={editorOpen}
				onClose={() => setEditorOpen(false)}
				step={editorStep}
				defaultPhase={phase}
			/>
		</div>
	);
};
