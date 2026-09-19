import { randomUUID } from "node:crypto";
import { prisma } from "@/prisma/connection";
import { SEED_CARE_STEPS, SEED_EXERCISES, SEED_ROUTINES, youtubeSearchUrl } from "./defaults";

/**
 * Gives a brand-new account a starter workout plan and care routine, so the
 * app is never a blank slate. Guarded by `User.seeded`, so it runs exactly
 * once and is safe to call on every request.
 *
 * The macros library is deliberately NOT seeded: those numbers only mean
 * something if they describe what you actually eat, in your own portions.
 *
 * Everything is written in a handful of `createMany` batches rather than
 * row-by-row: against a remote database the per-row round trips alone were
 * enough to exhaust the interactive-transaction timeout, which rolled a
 * routine out from under its own items.
 */
export const seedUser = async (userId: string): Promise<void> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { seeded: true },
	});
	if (!user || user.seeded) return;

	await prisma.$transaction(
		async (tx) => {
			// Re-check inside the transaction so two parallel requests can't both seed.
			const fresh = await tx.user.findUnique({
				where: { id: userId },
				select: { seeded: true },
			});
			if (!fresh || fresh.seeded) return;
			await tx.user.update({ where: { id: userId }, data: { seeded: true } });

			const exercises = SEED_EXERCISES.map((exercise) => ({
				id: randomUUID(),
				userId,
				name: exercise.name,
				muscleGroup: exercise.muscleGroup,
				defaultSets: exercise.defaultSets,
				defaultReps: exercise.defaultReps,
				notes: exercise.notes ?? null,
				youtubeUrl: youtubeSearchUrl(exercise.name),
			}));
			const exerciseByName = new Map(exercises.map((e) => [e.name, e]));

			const routines = SEED_ROUTINES.map((routine) => ({
				id: randomUUID(),
				userId,
				name: routine.name,
				focus: routine.focus,
				color: routine.color,
				emoji: routine.emoji,
			}));

			const routineItems = SEED_ROUTINES.flatMap((seed, index) =>
				seed.exercises.flatMap((name, position) => {
					const exercise = exerciseByName.get(name);
					if (!exercise) return [];
					return [
						{
							routineId: routines[index].id,
							exerciseId: exercise.id,
							position,
							sets: exercise.defaultSets,
							reps: exercise.defaultReps,
						},
					];
				}),
			);

			// Every weekday gets a row; the ones no routine claims are rest days.
			const scheduledBy = new Map<number, string>();
			SEED_ROUTINES.forEach((seed, index) => {
				for (const weekday of seed.weekdays) scheduledBy.set(weekday, routines[index].id);
			});
			const slots = Array.from({ length: 7 }, (_, weekday) => ({
				userId,
				weekday,
				routineId: scheduledBy.get(weekday) ?? null,
			}));

			await tx.exercise.createMany({ data: exercises, skipDuplicates: true });
			await tx.routine.createMany({ data: routines });
			await tx.routineItem.createMany({ data: routineItems });
			await tx.scheduleSlot.createMany({ data: slots, skipDuplicates: true });
			await tx.careStep.createMany({
				data: SEED_CARE_STEPS.map((step, position) => ({
					userId,
					name: step.name,
					emoji: step.emoji,
					note: step.note ?? null,
					phase: step.phase,
					frequency: step.frequency,
					weekdays: step.weekdays ?? [],
					position,
				})),
			});
		},
		// Generous, because this runs once per account against a remote database.
		{ timeout: 30_000, maxWait: 10_000 },
	);
};
