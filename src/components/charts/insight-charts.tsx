"use client";

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AXIS_TICK, ChartFrame, GRID_STROKE, TooltipCard } from "./frame";
import { fromDayKey } from "@/lib/dates";
import type { InsightDay, Insights } from "@/lib/types";

const shortDate = (key: string) => {
	const d = fromDayKey(key);
	return `${d.getDate()}/${d.getMonth() + 1}`;
};

/** Keep roughly six ticks on screen whatever the range. */
const tickInterval = (count: number) => Math.max(0, Math.ceil(count / 6) - 1);

const kcal = (n: number) => `${Math.round(n).toLocaleString()} kcal`;

const signed = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n).toLocaleString()} kcal`;

/** Recharts hands the tooltip a loosely-typed payload; narrow it once, here. */
type TooltipContentProps = { active?: boolean; payload?: { payload?: unknown }[] };

const datum = <T,>(props: TooltipContentProps): T | null =>
	props.active && props.payload?.[0]?.payload ? (props.payload[0].payload as T) : null;

/* ---------- Calories against target ---------- */

export const CaloriesChart = ({ series, target }: { series: InsightDay[]; target: number }) => (
	<ChartFrame
		title="Daily calories"
		caption={`Target ${target.toLocaleString()} kcal — bars above the line are over budget`}
		legend={[
			{ label: "At or under target", color: "var(--viz-1)" },
			{ label: "Over target", color: "var(--critical)" },
			{ label: `Target ${target.toLocaleString()} kcal`, color: "var(--critical)", line: true },
		]}
		table={{
			columns: ["Date", "Calories", "vs target"],
			rows: series
				.filter((d) => d.meals > 0)
				.map((d) => [shortDate(d.date), d.calories, `${d.calories - target > 0 ? "+" : ""}${d.calories - target}`]),
		}}
	>
		<ResponsiveContainer width="100%" height={200}>
			<BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
				<CartesianGrid vertical={false} stroke={GRID_STROKE} />
				<XAxis
					dataKey="date"
					tickFormatter={shortDate}
					tick={AXIS_TICK}
					tickLine={false}
					axisLine={false}
					interval={tickInterval(series.length)}
				/>
				<YAxis
					tick={AXIS_TICK}
					tickLine={false}
					axisLine={false}
					width={40}
					tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
				/>
				<Tooltip
					cursor={{ fill: "var(--secondary)" }}
					content={(props: TooltipContentProps) => {
						const day = datum<InsightDay>(props);
						if (!day) return null;
						return (
							<TooltipCard
								title={shortDate(day.date)}
								rows={[
									{
										label: "Calories",
										value: kcal(day.calories),
										color: day.calories > target ? "var(--critical)" : "var(--viz-1)",
									},
									{ label: "Target", value: kcal(target), color: "var(--critical)" },
									{ label: "vs target", value: signed(day.calories - target) },
									{ label: "Protein", value: `${day.proteinG} g` },
									{ label: "Items", value: `${day.meals}` },
								]}
							/>
						);
					}}
				/>
				<Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={22}>
					{series.map((d) => (
						<Cell
							key={d.date}
							fill={d.calories > target ? "var(--critical)" : "var(--viz-1)"}
						/>
					))}
				</Bar>
				{/* Declared after <Bar> so the target line draws on top of the bars it
				    cuts through, and dashed so it never reads as a plotted series. The
				    legend above carries its value — an inline label would land on a red
				    bar on exactly the days that matter most. */}
				<ReferenceLine
					y={target}
					stroke="var(--critical)"
					strokeWidth={2}
					strokeDasharray="5 4"
					ifOverflow="extendDomain"
				/>
			</BarChart>
		</ResponsiveContainer>
	</ChartFrame>
);

/* ---------- The deficit journey ---------- */

export const DeficitChart = ({
	data,
}: {
	data: Insights["deficitSeries"];
}) => (
	<ChartFrame
		title="Cumulative deficit"
		caption="Running total of calories under target. Above zero is a deficit."
		table={{
			columns: ["Date", "Day", "Running"],
			rows: data
				.filter((d) => d.dailyDeficit !== 0)
				.map((d) => [shortDate(d.date), d.dailyDeficit, d.cumulativeDeficit]),
		}}
	>
		<ResponsiveContainer width="100%" height={190}>
			<AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
				<defs>
					<linearGradient id="deficitFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.35} />
						<stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} stroke={GRID_STROKE} />
				<XAxis
					dataKey="date"
					tickFormatter={shortDate}
					tick={AXIS_TICK}
					tickLine={false}
					axisLine={false}
					interval={tickInterval(data.length)}
				/>
				<YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
				<Tooltip
					cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
					content={(props: TooltipContentProps) => {
						const day = datum<Insights["deficitSeries"][number]>(props);
						if (!day) return null;
						return (
							<TooltipCard
								title={shortDate(day.date)}
								rows={[
									{ label: "Running total", value: kcal(day.cumulativeDeficit), color: "var(--viz-1)" },
									{ label: "That day", value: kcal(day.dailyDeficit) },
								]}
							/>
						);
					}}
				/>
				<ReferenceLine y={0} stroke="var(--viz-axis)" strokeWidth={1} />
				<Area
					type="monotone"
					dataKey="cumulativeDeficit"
					stroke="var(--viz-1)"
					strokeWidth={2}
					fill="url(#deficitFill)"
					activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
				/>
			</AreaChart>
		</ResponsiveContainer>
	</ChartFrame>
);

/* ---------- Weight ---------- */

export const WeightChart = ({
	series,
	goalWeightKg,
}: {
	series: InsightDay[];
	goalWeightKg: number | null;
}) => {
	const points = series.filter((d) => d.weightKg !== null);
	const latest = points[points.length - 1]?.weightKg ?? null;

	const caption =
		latest === null
			? "Log a weight from the Today tab"
			: goalWeightKg === null
				? `Now ${latest} kg — set a goal weight in Profile`
				: `Now ${latest} kg · goal ${goalWeightKg} kg · ${toGo(latest, goalWeightKg)}`;

	return (
		<ChartFrame
			title="Weight"
			caption={caption}
			legend={
				goalWeightKg
					? [
							{ label: "Weight", color: "var(--viz-3)" },
							{ label: `Goal ${goalWeightKg} kg`, color: "var(--good)", line: true },
						]
					: undefined
			}
			table={{
				columns: ["Date", "Weight (kg)"],
				rows: points.map((d) => [shortDate(d.date), d.weightKg ?? ""]),
			}}
		>
			{points.length === 0 ? (
				<p className="py-10 text-center text-sm text-muted-foreground">
					No weigh-ins in this range yet.
				</p>
			) : (
				<ResponsiveContainer width="100%" height={190}>
					<LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
						<CartesianGrid vertical={false} stroke={GRID_STROKE} />
						<XAxis
							dataKey="date"
							tickFormatter={shortDate}
							tick={AXIS_TICK}
							tickLine={false}
							axisLine={false}
							interval={tickInterval(series.length)}
						/>
						<YAxis
							tick={AXIS_TICK}
							tickLine={false}
							axisLine={false}
							width={40}
							// The goal has to be folded into the domain here: an explicit
							// domain wins over the reference line's own ifOverflow, so a
							// goal outside the logged range would otherwise never be drawn.
							domain={[
								(min: number) => Math.floor(Math.min(min, goalWeightKg ?? min) - 1),
								(max: number) => Math.ceil(Math.max(max, goalWeightKg ?? max) + 1),
							]}
						/>
						<Tooltip
							cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
							content={(props: TooltipContentProps) => {
								const day = datum<InsightDay>(props);
								if (!day || day.weightKg === null) return null;
								return (
									<TooltipCard
										title={shortDate(day.date)}
										rows={[{ label: "Weight", value: `${day.weightKg} kg`, color: "var(--viz-3)" }]}
									/>
								);
							}}
						/>
						{goalWeightKg !== null && (
							// extendDomain keeps the goal on screen even when it is far from
							// the weights actually logged — otherwise the line vanishes.
							<ReferenceLine
								y={goalWeightKg}
								stroke="var(--good)"
								strokeWidth={2}
								strokeDasharray="5 4"
								ifOverflow="extendDomain"
								label={{
									value: `Goal ${goalWeightKg}`,
									position: "insideTopRight",
									fontSize: 10,
									fontWeight: 600,
									fill: "var(--good)",
								}}
							/>
						)}
						<Line
							type="monotone"
							dataKey="weightKg"
							stroke="var(--viz-3)"
							strokeWidth={2}
							dot={{ r: 3, fill: "var(--viz-3)", strokeWidth: 0 }}
							activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
							connectNulls
						/>
					</LineChart>
				</ResponsiveContainer>
			)}
		</ChartFrame>
	);
};

const toGo = (current: number, goal: number): string => {
	const delta = Math.round((current - goal) * 10) / 10;
	if (delta === 0) return "at goal";
	return `${Math.abs(delta)} kg to ${delta > 0 ? "lose" : "gain"}`;
};

/* ---------- Macros ---------- */

const MACROS = [
	{ key: "proteinG", label: "Protein", color: "var(--viz-1)" },
	{ key: "carbsG", label: "Carbs", color: "var(--viz-2)" },
	{ key: "fatG", label: "Fat", color: "var(--viz-3)" },
] as const;

export const MacroChart = ({ series }: { series: InsightDay[] }) => {
	const recent = series.slice(-14);

	return (
		<ChartFrame
			title="Macros"
			caption="Grams per day, last 14 days"
			legend={MACROS.map((m) => ({ label: m.label, color: m.color }))}
			table={{
				columns: ["Date", "Protein", "Carbs", "Fat"],
				rows: recent
					.filter((d) => d.meals > 0)
					.map((d) => [shortDate(d.date), d.proteinG, d.carbsG, d.fatG]),
			}}
		>
			<ResponsiveContainer width="100%" height={190}>
				<BarChart data={recent} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
					<CartesianGrid vertical={false} stroke={GRID_STROKE} />
					<XAxis
						dataKey="date"
						tickFormatter={shortDate}
						tick={AXIS_TICK}
						tickLine={false}
						axisLine={false}
						interval={tickInterval(recent.length)}
					/>
					<YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
					<Tooltip
						cursor={{ fill: "var(--secondary)" }}
						content={(props: TooltipContentProps) => {
							const day = datum<InsightDay>(props);
							if (!day) return null;
							return (
								<TooltipCard
									title={shortDate(day.date)}
									rows={MACROS.map((m) => ({
										label: m.label,
										value: `${day[m.key]} g`,
										color: m.color,
									}))}
								/>
							);
						}}
					/>
					{MACROS.map((m, i) => (
						<Bar
							key={m.key}
							dataKey={m.key}
							stackId="macros"
							fill={m.color}
							// A 2px surface-coloured stroke reads as a gap between segments.
							stroke="var(--card)"
							strokeWidth={2}
							maxBarSize={24}
							radius={i === MACROS.length - 1 ? [4, 4, 0, 0] : undefined}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</ChartFrame>
	);
};

/* ---------- Training volume ---------- */

export const VolumeChart = ({ series }: { series: InsightDay[] }) => (
	<ChartFrame
		title="Training volume"
		caption="Reps × weight per day. Bodyweight and timed work show as sets only."
		table={{
			columns: ["Date", "Sets", "Volume (kg)"],
			rows: series.filter((d) => d.sets > 0).map((d) => [shortDate(d.date), d.sets, d.volumeKg]),
		}}
	>
		<ResponsiveContainer width="100%" height={190}>
			<BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
				<CartesianGrid vertical={false} stroke={GRID_STROKE} />
				<XAxis
					dataKey="date"
					tickFormatter={shortDate}
					tick={AXIS_TICK}
					tickLine={false}
					axisLine={false}
					interval={tickInterval(series.length)}
				/>
				<YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={52} />
				<Tooltip
					cursor={{ fill: "var(--secondary)" }}
					content={(props: TooltipContentProps) => {
						const day = datum<InsightDay>(props);
						if (!day) return null;
						return (
							<TooltipCard
								title={shortDate(day.date)}
								rows={[
									{ label: "Volume", value: `${day.volumeKg.toLocaleString()} kg`, color: "var(--viz-7)" },
									{ label: "Sets", value: `${day.sets}` },
								]}
							/>
						);
					}}
				/>
				<Bar dataKey="volumeKg" fill="var(--viz-7)" radius={[4, 4, 0, 0]} maxBarSize={22} />
			</BarChart>
		</ResponsiveContainer>
	</ChartFrame>
);

/* ---------- Top foods ---------- */

export const TopFoodsChart = ({ foods }: { foods: Insights["topFoods"] }) => (
	<ChartFrame
		title="Where the calories came from"
		caption="Total contribution over the range"
		table={{
			columns: ["Food", "Times", "Calories"],
			rows: foods.map((f) => [f.name, f.count, f.calories]),
		}}
	>
		{foods.length === 0 ? (
			<p className="py-10 text-center text-sm text-muted-foreground">Nothing logged yet.</p>
		) : (
			<ul className="space-y-2.5">
				{foods.map((food) => {
					const max = foods[0].calories || 1;
					return (
						<li key={food.name}>
							<div className="flex items-baseline justify-between gap-3 text-sm">
								<span className="truncate">{food.name}</span>
								<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
									{food.calories.toLocaleString()} kcal · {food.count}×
								</span>
							</div>
							<div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
								<div
									className="h-full rounded-full"
									style={{
										width: `${Math.max(3, (food.calories / max) * 100)}%`,
										backgroundColor: "var(--viz-1)",
									}}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		)}
	</ChartFrame>
);
