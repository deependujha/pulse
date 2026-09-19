"use client";

import { useState, useSyncExternalStore } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { FiLogOut, FiMonitor, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import {
	Labelled,
	PrimaryButton,
	SectionTitle,
	Spinner,
	TextInput,
} from "@/components/common/bits";
import type { Profile } from "@/lib/types";
import { api, refreshAll, useAction, useResource } from "@/lib/api";
import { CURRENT_VERSION } from "@/constants/version";
import type { Bootstrap } from "@/lib/types";
import { cn } from "@/lib/utils";

const THEMES = [
	{ id: "light", label: "Light", icon: FiSun },
	{ id: "dark", label: "Dark", icon: FiMoon },
	{ id: "system", label: "Auto", icon: FiMonitor },
];

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
	const profile = bootstrap.data?.profile;
	const { theme, setTheme } = useTheme();
	const mounted = useMounted();

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

			<section>
				<SectionTitle title="Goals" caption="Everything in the app measures against these" />
				{profile && <GoalsForm key={profile.id} profile={profile} />}
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
					<Row label="Workouts" value={`${bootstrap.data?.routines.length ?? 0}`} />
					<Row label="Exercises" value={`${bootstrap.data?.exercises.length ?? 0}`} />
					<Row label="Library items" value={`${bootstrap.data?.library.length ?? 0}`} />
					<Row label="Care steps" value={`${bootstrap.data?.careSteps.length ?? 0}`} />
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
		</div>
	);
};

/** Seeded from the loaded profile via its key, so no effect syncs the fields. */
const GoalsForm = ({ profile }: { profile: Profile }) => {
	const [form, setForm] = useState({
		calorieTarget: String(profile.calorieTarget),
		proteinTarget: String(profile.proteinTarget),
		waterTargetMl: String(profile.waterTargetMl),
		sleepTargetHours: String(profile.sleepTargetHours),
		heightCm: profile.heightCm ? String(profile.heightCm) : "",
		currentWeightKg: profile.currentWeightKg ? String(profile.currentWeightKg) : "",
		goalWeightKg: profile.goalWeightKg ? String(profile.goalWeightKg) : "",
	});
	const { pending, run } = useAction();

	const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }));

	const current = Number(form.currentWeightKg);
	const goal = Number(form.goalWeightKg);
	const weightGap =
		current > 0 && goal > 0 ? Math.round((current - goal) * 10) / 10 : null;

	const save = async () => {
		const result = await run(
			() =>
				api.patch("/api/profile", {
					calorieTarget: Number(form.calorieTarget) || 2000,
					proteinTarget: Number(form.proteinTarget) || 0,
					waterTargetMl: Number(form.waterTargetMl) || 0,
					sleepTargetHours: Number(form.sleepTargetHours) || 0,
					heightCm: form.heightCm.trim(),
					currentWeightKg: form.currentWeightKg.trim(),
					goalWeightKg: form.goalWeightKg.trim(),
				}),
			(message) => toast.error(message),
		);

		if (!result) return;
		// The weight also lands on today's metric row, so the Today tab and the
		// charts have to reload alongside the profile.
		await refreshAll("/api/bootstrap", "/api/insights", "/api/metrics");
		toast.success("Goals updated");
	};

	return (
		<div className="space-y-4 rounded-2xl border border-border bg-card p-4">
			<div className="space-y-3">
				<h4 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
					Daily targets
				</h4>
				<div className="grid grid-cols-2 gap-3">
					<Labelled label="Calories (kcal)">
						<TextInput
							type="number"
							inputMode="numeric"
							value={form.calorieTarget}
							onChange={set("calorieTarget")}
							placeholder="2000"
						/>
					</Labelled>
					<Labelled label="Protein (g)">
						<TextInput
							type="number"
							inputMode="numeric"
							value={form.proteinTarget}
							onChange={set("proteinTarget")}
							placeholder="120"
						/>
					</Labelled>
					<Labelled label="Water (ml)">
						<TextInput
							type="number"
							inputMode="numeric"
							step={250}
							value={form.waterTargetMl}
							onChange={set("waterTargetMl")}
							placeholder="2500"
						/>
					</Labelled>
					<Labelled label="Sleep (hours)">
						<TextInput
							type="number"
							inputMode="decimal"
							step={0.5}
							value={form.sleepTargetHours}
							onChange={set("sleepTargetHours")}
							placeholder="8"
						/>
					</Labelled>
				</div>
			</div>

			<div className="space-y-3 border-t border-border pt-4">
				<h4 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
					Body
				</h4>
				<div className="grid grid-cols-3 gap-3">
					<Labelled label="Height (cm)">
						<TextInput
							type="number"
							inputMode="decimal"
							value={form.heightCm}
							onChange={set("heightCm")}
							placeholder="175"
						/>
					</Labelled>
					<Labelled label="Now (kg)">
						<TextInput
							type="number"
							inputMode="decimal"
							step={0.1}
							value={form.currentWeightKg}
							onChange={set("currentWeightKg")}
							placeholder="78"
						/>
					</Labelled>
					<Labelled label="Goal (kg)">
						<TextInput
							type="number"
							inputMode="decimal"
							step={0.1}
							value={form.goalWeightKg}
							onChange={set("goalWeightKg")}
							placeholder="70"
						/>
					</Labelled>
				</div>
				<p className="text-xs text-muted-foreground">
					{weightGap === null
						? "Saving a weight here also logs it as today's weigh-in."
						: weightGap === 0
							? "You're at your goal weight."
							: `${Math.abs(weightGap)} kg to ${weightGap > 0 ? "lose" : "gain"}${
									profile.startWeightKg
										? ` · started at ${profile.startWeightKg} kg`
										: ""
								}`}
				</p>
			</div>

			<PrimaryButton onClick={save} disabled={pending}>
				{pending ? "Saving…" : "Save goals"}
			</PrimaryButton>
		</div>
	);
};

const Row = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-center justify-between">
		<dt className="text-muted-foreground">{label}</dt>
		<dd className="font-medium tabular-nums">{value}</dd>
	</div>
);
