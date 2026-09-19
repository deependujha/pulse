"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import {
	Labelled,
	PrimaryButton,
	SegmentedControl,
	TextArea,
	TextInput,
} from "@/components/common/bits";
import { api, refreshAll, useAction } from "@/lib/api";
import { WEEKDAY_SHORT } from "@/lib/dates";
import type { CareStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARE_EMOJIS = ["🧴", "🫧", "💧", "☀️", "🌙", "🍊", "🪥", "💊", "🧼", "✨", "🧖", "💆"];

const FREQUENCIES = [
	{ id: "EVERY_DAY", label: "Daily" },
	{ id: "ALTERNATE", label: "Alternate" },
	{ id: "WEEKDAYS", label: "Pick days" },
] as const;

type Props = {
	open: boolean;
	onClose: () => void;
	step: CareStep | null;
	defaultPhase: "AM" | "PM";
};

/**
 * Create or edit one care step, including how often it's actually due.
 * Mounted only while open and keyed on the step, so the fields seed from props.
 */
export const CareStepEditor = (props: Props) => {
	if (!props.open) return null;
	return <CareStepForm key={props.step?.id ?? "new"} {...props} />;
};

const CareStepForm = ({ open, onClose, step, defaultPhase }: Props) => {
	const [name, setName] = useState(step?.name ?? "");
	const [emoji, setEmoji] = useState(step?.emoji ?? "🧴");
	const [note, setNote] = useState(step?.note ?? "");
	const [product, setProduct] = useState(step?.product ?? "");
	const [phase, setPhase] = useState<"AM" | "PM">(step?.phase ?? defaultPhase);
	const [frequency, setFrequency] = useState<CareStep["frequency"]>(
		step?.frequency ?? "EVERY_DAY",
	);
	const [weekdays, setWeekdays] = useState<number[]>(step?.weekdays ?? []);
	const { pending, run } = useAction();

	const save = async () => {
		if (!name.trim()) {
			toast.error("Give the step a name");
			return;
		}
		if (frequency === "WEEKDAYS" && weekdays.length === 0) {
			toast.error("Pick at least one day");
			return;
		}

		const body = {
			name: name.trim(),
			emoji,
			note: note.trim(),
			product: product.trim(),
			phase,
			frequency,
			weekdays,
		};

		const result = await run(
			() => (step ? api.patch(`/api/care/steps/${step.id}`, body) : api.post("/api/care/steps", body)),
			(message) => toast.error(message),
		);

		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/care");
		toast.success(step ? "Step updated" : "Step added");
		onClose();
	};

	const remove = async () => {
		if (!step) return;
		const result = await run(
			() => api.del(`/api/care/steps/${step.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/care");
		toast.success(`Removed ${step.name}`);
		onClose();
	};

	return (
		<Screen
			open={open}
			onClose={onClose}
			title={step ? "Edit step" : "New step"}
			footer={
				<div className="space-y-2">
					<PrimaryButton onClick={save} disabled={pending}>
						{pending ? "Saving…" : step ? "Save changes" : "Add step"}
					</PrimaryButton>
					{step && (
						<button
							type="button"
							onClick={remove}
							disabled={pending}
							className="h-10 w-full rounded-xl text-sm font-medium text-[var(--critical)] active:scale-[0.99]"
						>
							Delete step
						</button>
					)}
				</div>
			}
		>
			<div className="space-y-4 pb-2">
				<Labelled label="Step">
					<TextInput
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Niacinamide serum"
						autoFocus={!step}
					/>
				</Labelled>

				<div>
					<span className="mb-1.5 block text-sm font-medium">Icon</span>
					<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
						{CARE_EMOJIS.map((option) => (
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
					<span className="mb-1.5 block text-sm font-medium">When</span>
					<SegmentedControl
						value={phase}
						onChange={setPhase}
						options={[
							{ id: "AM", label: "Morning" },
							{ id: "PM", label: "Night" },
						]}
					/>
				</div>

				<div>
					<span className="mb-1.5 block text-sm font-medium">How often</span>
					<SegmentedControl
						value={frequency}
						onChange={setFrequency}
						options={FREQUENCIES.map((f) => ({ id: f.id, label: f.label }))}
					/>

					{frequency === "ALTERNATE" && (
						<p className="mt-2 text-xs text-muted-foreground">
							Due on odd dates — roughly every other day.
						</p>
					)}

					{frequency === "WEEKDAYS" && (
						<div className="mt-2 flex gap-1.5">
							{WEEKDAY_SHORT.map((label, index) => {
								const active = weekdays.includes(index);
								return (
									<button
										key={label}
										type="button"
										aria-pressed={active}
										onClick={() =>
											setWeekdays((prev) =>
												prev.includes(index)
													? prev.filter((d) => d !== index)
													: [...prev, index].sort(),
											)
										}
										className={cn(
											"h-10 flex-1 rounded-xl border text-xs font-medium transition active:scale-95",
											active
												? "border-foreground bg-foreground text-background"
												: "border-border text-muted-foreground",
										)}
									>
										{label[0]}
									</button>
								);
							})}
						</div>
					)}
				</div>

				<Labelled label="Product" hint="Which bottle this actually is">
					<TextInput
						value={product}
						onChange={(e) => setProduct(e.target.value)}
						placeholder="The Ordinary 10% Niacinamide"
					/>
				</Labelled>

				<Labelled label="Note">
					<TextArea
						rows={2}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Pea-sized amount, avoid the eye area."
					/>
				</Labelled>
			</div>
		</Screen>
	);
};
