"use client";

import { useState, useSyncExternalStore } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import type { IconType } from "react-icons";
import {
	FiActivity,
	FiChevronRight,
	FiLogOut,
	FiMonitor,
	FiMoon,
	FiPieChart,
	FiSun,
	FiTarget,
	FiUser,
} from "react-icons/fi";
import { SectionTitle, Spinner } from "@/components/common/bits";
import { LibraryManager } from "@/components/navigation_tabs/macros/library_manager";
import { PlanManager } from "@/components/navigation_tabs/workout/plan_manager";
import { GoalsScreen } from "./goals_screen";
import { useResource } from "@/lib/api";
import { CURRENT_VERSION } from "@/constants/version";
import type { Bootstrap } from "@/lib/types";
import { cn } from "@/lib/utils";

const THEMES = [
	{ id: "light", label: "Light", icon: FiSun },
	{ id: "dark", label: "Dark", icon: FiMoon },
	{ id: "system", label: "Auto", icon: FiMonitor },
];

type Panel = "goals" | "library" | "plan" | null;

/**
 * `useTheme()` can't be trusted until hydration, and the themed buttons would
 * otherwise mismatch the server render. This reports false on the server and
 * true on the client without an effect.
 */
const useMounted = () =>
	useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

export const ProfileTab = () => {
	const { data: session } = useSession();
	const bootstrap = useResource<Bootstrap>("/api/bootstrap");
	const { theme, setTheme } = useTheme();
	const mounted = useMounted();
	const [panel, setPanel] = useState<Panel>(null);

	const data = bootstrap.data;
	const profile = data?.profile;

	if (bootstrap.loading) return <Spinner label="Loading your profile" />;

	return (
		<div className="space-y-6">
			<section className="flex flex-col items-center gap-3 pt-2">
				<div className="grid size-20 place-items-center overflow-hidden rounded-full bg-secondary">
					{session?.user?.image ? (
						<img
							src={session.user.image}
							alt=""
							className="size-full object-cover"
							referrerPolicy="no-referrer"
						/>
					) : (
						<FiUser size={30} className="text-muted-foreground" />
					)}
				</div>
				<div className="text-center">
					<div className="font-medium">{session?.user?.name ?? "Guest"}</div>
					<div className="text-sm text-muted-foreground">
						{session?.user?.email ?? "Not signed in"}
					</div>
				</div>
			</section>

			{/* Everything you set up rather than log, in one place. */}
			<section>
				<SectionTitle title="Set up" caption="What the tracking measures against" />
				<div className="overflow-hidden rounded-2xl border border-border bg-card">
					<MenuRow
						icon={FiTarget}
						label="Targets"
						value={
							profile
								? `${profile.calorieTarget.toLocaleString()} kcal · ${profile.proteinTarget} g protein`
								: undefined
						}
						onClick={() => setPanel("goals")}
					/>
					<MenuRow
						icon={FiPieChart}
						label="Macros library"
						value={count(data?.library.length ?? 0, "item")}
						onClick={() => setPanel("library")}
					/>
					<MenuRow
						icon={FiActivity}
						label="Workouts & plan"
						value={`${count(data?.routines.length ?? 0, "workout")} · ${count(
							data?.exercises.length ?? 0,
							"exercise",
						)}`}
						onClick={() => setPanel("plan")}
						last
					/>
				</div>
			</section>

			<section>
				<SectionTitle title="Appearance" />
				<div className="flex gap-2">
					{THEMES.map((option) => {
						const Icon = option.icon;
						const active = mounted && theme === option.id;
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => setTheme(option.id)}
								aria-pressed={active}
								className={cn(
									"flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-medium transition active:scale-95",
									active ? "border-foreground bg-secondary" : "border-border bg-card",
								)}
							>
								<Icon size={17} />
								{option.label}
							</button>
						);
					})}
				</div>
			</section>

			<section>
				<SectionTitle title="Your data" />
				<dl className="space-y-1.5 rounded-2xl border border-border bg-card p-4 text-sm">
					<Row label="Care steps" value={`${data?.careSteps.length ?? 0}`} />
					{profile?.currentWeightKg && (
						<Row label="Current weight" value={`${profile.currentWeightKg} kg`} />
					)}
					{profile && (
						<Row
							label="Tracking since"
							value={new Date(profile.createdAt).toLocaleDateString(undefined, {
								month: "short",
								year: "numeric",
							})}
						/>
					)}
				</dl>
			</section>

			<section className="space-y-3">
				<button
					type="button"
					onClick={() => signOut()}
					className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium active:scale-[0.99]"
				>
					<FiLogOut size={16} />
					Sign out
				</button>
				<p className="text-center text-xs text-muted-foreground">
					pulse • v{CURRENT_VERSION} • no ads, no noise
				</p>
			</section>

			{profile && (
				<GoalsScreen
					open={panel === "goals"}
					onClose={() => setPanel(null)}
					profile={profile}
				/>
			)}

			<LibraryManager
				open={panel === "library"}
				onClose={() => setPanel(null)}
				library={data?.library ?? []}
			/>

			<PlanManager
				open={panel === "plan"}
				onClose={() => setPanel(null)}
				routines={data?.routines ?? []}
				exercises={data?.exercises ?? []}
				schedule={data?.schedule ?? []}
			/>
		</div>
	);
};

/** "1 workout" rather than "1 workouts". */
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const MenuRow = ({
	icon: Icon,
	label,
	value,
	onClick,
	last = false,
}: {
	icon: IconType;
	label: string;
	value?: string;
	onClick: () => void;
	last?: boolean;
}) => (
	<button
		type="button"
		onClick={onClick}
		className={cn(
			"flex min-h-15 w-full items-center gap-3 px-4 py-3 text-left active:bg-secondary",
			!last && "border-b border-border",
		)}
	>
		<Icon size={18} className="shrink-0 text-muted-foreground" />
		<span className="min-w-0 flex-1">
			<span className="block text-sm font-medium">{label}</span>
			{value && <span className="block truncate text-xs text-muted-foreground">{value}</span>}
		</span>
		<FiChevronRight size={17} className="shrink-0 text-muted-foreground" />
	</button>
);

const Row = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-center justify-between">
		<dt className="text-muted-foreground">{label}</dt>
		<dd className="font-medium tabular-nums">{value}</dd>
	</div>
);
