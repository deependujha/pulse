"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import { Labelled, PrimaryButton, TextInput } from "@/components/common/bits";
import { api, refreshAll, useAction } from "@/lib/api";
import type { Profile } from "@/lib/types";

type Props = {
	open: boolean;
	onClose: () => void;
	profile: Profile;
};

/** Mounted only while open and keyed on the profile, so fields seed from props. */
export const GoalsScreen = (props: Props) => {
	if (!props.open) return null;
	return <GoalsForm key={props.profile.id} {...props} />;
};

const GoalsForm = ({ open, onClose, profile }: Props) => {
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
	const weightGap = current > 0 && goal > 0 ? Math.round((current - goal) * 10) / 10 : null;

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
		toast.success("Targets updated");
		onClose();
	};

	return (
		<Screen
			open={open}
			onClose={onClose}
			title="Targets"
			subtitle="Everything measures against these"
			footer={
				<PrimaryButton onClick={save} disabled={pending}>
					{pending ? "Saving…" : "Save targets"}
				</PrimaryButton>
			}
		>
			<div className="space-y-5 pb-2">
				<section className="space-y-3">
					<h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
						Every day
					</h3>
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
				</section>

				<section className="space-y-3 border-t border-border pt-5">
					<h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
						Body
					</h3>
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
										profile.startWeightKg ? ` · started at ${profile.startWeightKg} kg` : ""
									}`}
					</p>
				</section>
			</div>
		</Screen>
	);
};
