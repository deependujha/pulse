import { prisma } from "@/prisma/connection";

/**
 * The profile shape every endpoint hands back. Kept in one place so
 * /api/bootstrap and /api/profile can never drift apart.
 */
export const PROFILE_SELECT = {
	id: true,
	name: true,
	email: true,
	image: true,
	calorieTarget: true,
	proteinTarget: true,
	carbsTargetG: true,
	fatTargetG: true,
	fiberTargetG: true,
	waterTargetMl: true,
	sleepTargetHours: true,
	heightCm: true,
	currentWeightKg: true,
	startWeightKg: true,
	goalWeightKg: true,
	createdAt: true,
} as const;

/**
 * Recomputes the denormalised weight snapshot from the metric rows.
 *
 * Deriving both ends rather than assuming "the weight just written is the
 * current one" keeps things right when a weigh-in is backfilled onto an older
 * day, or when the newest one is deleted.
 */
export const syncWeightSnapshot = async (userId: string) => {
	const [latest, earliest] = await Promise.all([
		prisma.dailyMetric.findFirst({
			where: { userId, weightKg: { not: null } },
			orderBy: { date: "desc" },
			select: { weightKg: true },
		}),
		prisma.dailyMetric.findFirst({
			where: { userId, weightKg: { not: null } },
			orderBy: { date: "asc" },
			select: { weightKg: true },
		}),
	]);

	await prisma.user.update({
		where: { id: userId },
		data: {
			currentWeightKg: latest?.weightKg ?? null,
			startWeightKg: earliest?.weightKg ?? null,
		},
	});
};
