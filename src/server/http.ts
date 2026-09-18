import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export const unauthorized = () =>
	NextResponse.json({ error: "Not signed in" }, { status: 401 });

export const badRequest = (message: string) =>
	NextResponse.json({ error: message }, { status: 400 });

export const notFound = (message = "Not found") =>
	NextResponse.json({ error: message }, { status: 404 });

/**
 * Wraps a route handler so it only ever runs with a resolved user, and so an
 * unexpected throw turns into a 500 instead of an opaque stack trace.
 */
export const withUser = <C>(
	handler: (user: SessionUser, req: Request, ctx: C) => Promise<Response>,
) => {
	return async (req: Request, ctx: C): Promise<Response> => {
		const user = await getSessionUser();
		if (!user) return unauthorized();
		try {
			return await handler(user, req, ctx);
		} catch (error) {
			console.error("[pulse:api]", error);
			const message =
				error instanceof Error ? error.message : "Something went wrong";
			return NextResponse.json({ error: message }, { status: 500 });
		}
	};
};

export const readJson = async (req: Request): Promise<Record<string, unknown>> => {
	try {
		const body = await req.json();
		return body && typeof body === "object" ? body : {};
	} catch {
		return {};
	}
};

export const str = (v: unknown, fallback = ""): string =>
	typeof v === "string" ? v.trim() : fallback;

export const optionalStr = (v: unknown): string | null => {
	const s = typeof v === "string" ? v.trim() : "";
	return s.length > 0 ? s : null;
};

export const num = (v: unknown, fallback = 0): number => {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : fallback;
};

export const optionalNum = (v: unknown): number | null => {
	if (v === null || v === undefined || v === "") return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
};

export const bool = (v: unknown, fallback = false): boolean =>
	typeof v === "boolean" ? v : fallback;
