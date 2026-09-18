"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/common/sheet";
import {
	Labelled,
	PrimaryButton,
	Select,
	TextArea,
	TextInput,
} from "@/components/common/bits";
import { api, refreshAll, useAction } from "@/lib/api";
import { MUSCLE_GROUPS, type Exercise } from "@/lib/types";

type Props = {
	open: boolean;
	onClose: () => void;
	/** Editing an existing movement, or null to create a new one. */
	exercise: Exercise | null;
	onSaved?: (exercise: Exercise) => void;
};

const blank = {
	name: "",
	muscleGroup: "Other",
	defaultSets: "3",
	defaultReps: "8-12",
	youtubeUrl: "",
	imageUrl: "",
	gifUrl: "",
	notes: "",
};

const toForm = (exercise: Exercise | null) =>
	exercise
		? {
				name: exercise.name,
				muscleGroup: exercise.muscleGroup,
				defaultSets: String(exercise.defaultSets),
				defaultReps: exercise.defaultReps,
				youtubeUrl: exercise.youtubeUrl ?? "",
				imageUrl: exercise.imageUrl ?? "",
				gifUrl: exercise.gifUrl ?? "",
				notes: exercise.notes ?? "",
			}
		: blank;

/**
 * Create or edit one movement in the library — name, demo media, defaults.
 * The form only mounts while the sheet is open, keyed on what it is editing,
 * so its fields seed themselves instead of syncing through an effect.
 */
export const ExerciseEditor = (props: Props) => {
	if (!props.open) return null;
	return <ExerciseForm key={props.exercise?.id ?? "new"} {...props} />;
};

const ExerciseForm = ({ open, onClose, exercise, onSaved }: Props) => {
	const [form, setForm] = useState(() => toForm(exercise));
	const { pending, run } = useAction();

	const set = (key: keyof typeof blank) => (value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const save = async () => {
		if (!form.name.trim()) {
			toast.error("Give the exercise a name");
			return;
		}

		const body = {
			name: form.name.trim(),
			muscleGroup: form.muscleGroup,
			defaultSets: Number(form.defaultSets) || 3,
			defaultReps: form.defaultReps.trim() || "8-12",
			youtubeUrl: form.youtubeUrl.trim(),
			imageUrl: form.imageUrl.trim(),
			gifUrl: form.gifUrl.trim(),
			notes: form.notes.trim(),
		};

		const result = await run(
			() =>
				exercise
					? api.patch(`/api/exercises/${exercise.id}`, body)
					: api.post("/api/exercises", body),
			(message) => toast.error(message),
		);

		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/exercises", "/api/workout");
		toast.success(exercise ? "Exercise updated" : "Added to your library");
		onSaved?.((result as { exercise: Exercise }).exercise);
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={exercise ? "Edit exercise" : "New exercise"}
			subtitle="Demo links and images are optional"
			footer={
				<PrimaryButton onClick={save} disabled={pending}>
					{pending ? "Saving…" : exercise ? "Save changes" : "Add exercise"}
				</PrimaryButton>
			}
		>
			<div className="space-y-4 pb-2">
				<Labelled label="Name">
					<TextInput
						value={form.name}
						onChange={(e) => set("name")(e.target.value)}
						placeholder="Incline Bench Press"
						autoFocus={!exercise}
					/>
				</Labelled>

				<Labelled label="Muscle group">
					<Select
						value={form.muscleGroup}
						onChange={(e) => set("muscleGroup")(e.target.value)}
					>
						{MUSCLE_GROUPS.map((group) => (
							<option key={group} value={group}>
								{group}
							</option>
						))}
					</Select>
				</Labelled>

				<div className="grid grid-cols-2 gap-3">
					<Labelled label="Default sets">
						<TextInput
							type="number"
							inputMode="numeric"
							min={1}
							value={form.defaultSets}
							onChange={(e) => set("defaultSets")(e.target.value)}
						/>
					</Labelled>
					<Labelled label="Default reps">
						<TextInput
							value={form.defaultReps}
							onChange={(e) => set("defaultReps")(e.target.value)}
							placeholder="8-12 or 30 sec"
						/>
					</Labelled>
				</div>

				<Labelled label="YouTube demo" hint="Any video or search link">
					<TextInput
						type="url"
						inputMode="url"
						value={form.youtubeUrl}
						onChange={(e) => set("youtubeUrl")(e.target.value)}
						placeholder="https://youtube.com/watch?v=…"
					/>
				</Labelled>

				<Labelled label="Image URL" hint="Shown on the exercise card">
					<TextInput
						type="url"
						inputMode="url"
						value={form.imageUrl}
						onChange={(e) => set("imageUrl")(e.target.value)}
						placeholder="https://…/form.jpg"
					/>
				</Labelled>

				<Labelled label="GIF URL" hint="An animated demo, if you have one">
					<TextInput
						type="url"
						inputMode="url"
						value={form.gifUrl}
						onChange={(e) => set("gifUrl")(e.target.value)}
						placeholder="https://…/demo.gif"
					/>
				</Labelled>

				<Labelled label="Notes" hint="Cues you want to remember">
					<TextArea
						rows={3}
						value={form.notes}
						onChange={(e) => set("notes")(e.target.value)}
						placeholder="Elbows tucked, pause at the bottom."
					/>
				</Labelled>
			</div>
		</Sheet>
	);
};
