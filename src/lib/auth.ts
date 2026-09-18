import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/authoptions";
import { prisma } from "@/prisma/connection";

export type SessionUser = {
	id: string;
	email: string;
	calorieTarget: number;
	proteinTarget: number;
};

/**
 * Resolves the signed-in user row. Returns null when there is no session,
 * which every route handler turns into a 401.
 */
export const getSessionUser = async (): Promise<SessionUser | null> => {
	const session = await getServerSession(AuthOptions);
	const email = session?.user?.email;
	if (!email) return null;

	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true, email: true, calorieTarget: true, proteinTarget: true },
	});

	return user;
};
