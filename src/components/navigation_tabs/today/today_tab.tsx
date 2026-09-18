"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FiChevronRight, FiDroplet, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import { EmptyState, GhostButton, Labelled, PrimaryButton, SectionTitle, Spinner, Stat, TextInput } from "@/components/common/bits";
import { MiniRing, Ring } from "@/components/common/ring";
import { Sheet } from "@/components/common/sheet";
import { api, refreshAll, useAction, useResource } from "@/lib/api";
import { isStepDue } from "@/lib/care";
import { formatRelative, todayKey } from "@/lib/dates";
import type {
	Bootstrap,
	DailyMetric,
	Insights,
	MealEntry,
	WorkoutDay,
} from "@/lib/types";
import type { TabProps } from "@/components/navigation_tabs/tracker_map";

type MealsResponse = { entries: MealEntry[] };
type CareLogResponse = { doneStepIds: string[] };
type MetricsResponse = { metric: DailyMetric; lastWeight: { date: string; weightKg: number } | null };

const GLASS_ML = 250;

export const TodayTab = ({ date, onNavigate }: TabProps) => {
	const { data: session } = useSession();
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");
	const workout = useResource<WorkoutDay>(`/api/workout?date=${date}`);
	const meals = useResource<MealsResponse>(`/api/meals?date=${date}`);
	const care = useResource<CareLogResponse>(`/api/care/log?date=${date}`);
	const metricsKey = `/api/metrics?date=${date}`;
	const metrics = useResource<MetricsResponse>(metricsKey);
	const insights = useResource<Insights>("/api/insights?days=30");

	const [weightOpen, setWeightOpen] = useState(false);

	const profile = bootstrap.data?.profile;
	const calorieTarget = profile?.calorieTarget ?? 2000;
	const proteinTarget = profile?.proteinTarget ?? 120;

	const entries = meals.data?.entries ?? [];
	const calories = entries.reduce((sum, e) => sum + e.calories, 0);
	const protein = entries.reduce((sum, e) => sum + e.proteinG, 0);

	const routine = workout.data?.routine ?? null;
	const targetSets = routine?.items.reduce((sum, item) => sum + item.sets, 0) ?? 0;
	const doneSets = workout.data?.logs.length ?? 0;

	const careSteps = bootstrap.data?.careSteps ?? [];
	const careDue = careSteps.filter((step) => isStepDue(step, date));
	const careDoneIds = new Set(care.data?.doneStepIds ?? []);
	const careDone = careDue.filter((step) => careDoneIds.has(step.id)).length;

	const metric = metrics.data?.metric;
	const waterMl = metric?.waterMl ?? 0;
	const summary = insights.data?.summary;

	const loading = bootstrap.loading || workout.loading || meals.loading;
	const firstName = (session?.user?.name ?? "").split(" ")[0];

	const addWater = async (delta: number) => {
		const next = Math.max(0, waterMl + delta);
		try {
			await api.put("/api/metrics", { date, waterMl: next });
			await refreshAll(metricsKey);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save that");
		}
	};

	if (loading) return <Spinner label="Getting your day ready" />;

	return (
		<div className="space-y-5">
			<header>
				<h1 className="text-2xl font-semibold">
					{greeting()}
					{firstName ? `, ${firstName}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground">
					{formatRelative(date)}
					{date === todayKey() ? "" : " · viewing a past day"}
				</p>
			</header>

			<section className="rounded-2xl border border-border bg-card p-4">
				<div className="flex items-center justify-center">
					<Ring
						value={calories}
						max={calorieTarget}
						color="var(--accent-food)"
						label={
							calorieTarget - calories >= 0
								? `${(calorieTarget - calories).toLocaleString()} kcal left`
								: `${(calories - calorieTarget).toLocaleString()} kcal over`
						}
						caption="Calories today"
						overIsBad
					/>
				</div>

				<div className="mt-4 flex items-start justify-around border-t border-border pt-4">
					<MiniRing
						value={protein}
						max={proteinTarget}
						color="var(--viz-1)"
						label="Protein"
						display={`${Math.round(protein)}`}
					/>
					<MiniRing
						value={doneSets}
						max={targetSets || 1}
						color="var(--accent-workout)"
						label="Sets"
						display={`${doneSets}`}
					/>
					<MiniRing
						value={careDone}
						max={careDue.length || 1}
						color="var(--accent-care)"
						label="Care"
						display={`${careDone}`}
					/>
				</div>
			</section>

			<section className="grid grid-cols-3 gap-2">
				<Stat
					label="Log streak"
					value={`${summary?.logStreak ?? 0}d`}
					sub="days tracked"
				/>
				<Stat
					label="Training"
					value={`${summary?.workoutStreak ?? 0}d`}
					sub="streak"
				/>
				<Stat
					label="Deficit"
					value={`${Math.round((summary?.cumulativeDeficit ?? 0) / 1000)}k`}
					sub="kcal, 30 days"
					tone={(summary?.cumulativeDeficit ?? 0) >= 0 ? "good" : "critical"}
				/>
			</section>

			<section>
				<SectionTitle
					title="Today's workout"
					action={
						<button
							type="button"
							onClick={() => onNavigate("workout")}
							className="flex items-center gap-0.5 text-sm text-muted-foreground active:scale-95"
						>
							Open <FiChevronRight size={15} />
						</button>
					}
				/>

				{routine ? (
					<button
						type="button"
						onClick={() => onNavigate("workout")}
						className="w-full rounded-2xl border border-border p-4 text-left active:scale-[0.99]"
						style={{ backgroundColor: `${routine.color}12` }}
					>
						<div className="flex items-center gap-3">
							<span
								className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl"
								style={{ backgroundColor: `${routine.color}26` }}
							>
								{routine.emoji}
							</span>
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium">{routine.name}</div>
								<div className="truncate text-sm text-muted-foreground">
									{routine.focus ?? `${routine.items.length} exercises`}
								</div>
							</div>
							<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
								{doneSets}/{targetSets}
							</span>
						</div>
					</button>
				) : (
					<EmptyState emoji="🌿" title="Rest day" body="Nothing scheduled. Recover well." />
				)}
			</section>

			<section>
				<SectionTitle
					title="Body"
					caption="Weight and water"
					action={
						<button
							type="button"
							onClick={() => setWeightOpen(true)}
							className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95"
						>
							<FiPlus size={15} />
							Weight
						</button>
					}
				/>

				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-2xl border border-border bg-card p-3.5">
						<div className="text-[11px] tracking-wide text-muted-foreground uppercase">
							Weight
						</div>
						<div className="mt-1 text-xl font-semibold">
							{metric?.weightKg
								? `${metric.weightKg} kg`
								: metrics.data?.lastWeight
									? `${metrics.data.lastWeight.weightKg} kg`
									: "—"}
						</div>
						<div className="mt-0.5 text-xs text-muted-foreground">
							{metric?.weightKg
								? "logged today"
								: metrics.data?.lastWeight
									? `last on ${formatRelative(metrics.data.lastWeight.date)}`
									: "not logged yet"}
						</div>
					</div>

					<div className="rounded-2xl border border-border bg-card p-3.5">
						<div className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
							<FiDroplet size={12} />
							Water
						</div>
						<div className="mt-1 text-xl font-semibold">
							{(waterMl / 1000).toFixed(2).replace(/\.00$/, "")} L
						</div>
						<div className="mt-2 flex gap-1.5">
							<button
								type="button"
								onClick={() => addWater(-GLASS_ML)}
								disabled={waterMl === 0}
								aria-label="Remove a glass of water"
								className="h-8 flex-1 rounded-lg border border-border text-sm active:scale-95 disabled:opacity-40"
							>
								−
							</button>
							<button
								type="button"
								onClick={() => addWater(GLASS_ML)}
								aria-label="Add a glass of water"
								className="h-8 flex-1 rounded-lg border border-border text-sm active:scale-95"
							>
								+
							</button>
						</div>
					</div>
				</div>
			</section>

			<section>
				<SectionTitle
					title="Care"
					caption={`${careDone} of ${careDue.length} steps done`}
					action={
						<button
							type="button"
							onClick={() => onNavigate("care")}
							className="flex items-center gap-0.5 text-sm text-muted-foreground active:scale-95"
						>
							Open <FiChevronRight size={15} />
						</button>
					}
				/>
				<div className="flex flex-wrap gap-1.5">
					{careDue.map((step) => {
						const done = careDoneIds.has(step.id);
						return (
							<span
								key={step.id}
								className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
								style={{
									borderColor: done
										? "color-mix(in oklab, var(--accent-care) 45%, transparent)"
										: "var(--border)",
									backgroundColor: done
										? "color-mix(in oklab, var(--accent-care) 12%, transparent)"
										: "transparent",
									opacity: done ? 1 : 0.6,
								}}
							>
								{step.emoji} {step.name}
							</span>
						);
					})}
					{careDue.length === 0 && (
						<p className="text-sm text-muted-foreground">Nothing due today.</p>
					)}
				</div>
			</section>

			<GhostButton className="w-full" onClick={() => onNavigate("nutrition")}>
				Log what you ate
			</GhostButton>

			<WeightSheet
				open={weightOpen}
				onClose={() => setWeightOpen(false)}
				date={date}
				current={metric?.weightKg ?? metrics.data?.lastWeight?.weightKg ?? null}
				metricsKey={metricsKey}
			/>
		</div>
	);
};

const greeting = () => {
	const hour = new Date().getHours();
	if (hour < 5) return "Still up";
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
};

const WeightSheet = ({
	open,
	onClose,
	date,
	current,
	metricsKey,
}: {
	open: boolean;
	onClose: () => void;
	date: string;
	current: number | null;
	metricsKey: string;
}) => {
	const [value, setValue] = useState("");
	const { pending, run } = useAction();

	const save = async () => {
		if (!value.trim() || Number(value) <= 0) {
			toast.error("Enter a weight in kg");
			return;
		}
		const result = await run(
			() => api.put("/api/metrics", { date, weightKg: Number(value) }),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll(metricsKey, "/api/insights");
		toast.success("Weight logged");
		setValue("");
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title="Log weight"
			subtitle={current ? `Last recorded ${current} kg` : "Your first weigh-in"}
			footer={
				<PrimaryButton onClick={save} disabled={pending}>
					{pending ? "Saving…" : "Save"}
				</PrimaryButton>
			}
		>
			<div className="pb-2">
				<Labelled label="Weight (kg)" hint="Same time of day gives the cleanest trend">
					<TextInput
						type="number"
						inputMode="decimal"
						step="0.1"
						min={0}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={current ? String(current) : "72.5"}
						autoFocus
					/>
				</Labelled>
			</div>
		</Sheet>
	);
};
