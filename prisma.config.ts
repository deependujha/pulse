import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next reads `.env.local`, but `dotenv/config` only reads `.env`, so the CLI
// would otherwise see no DATABASE_URL locally. Earlier entries win, and a real
// environment variable (Vercel, CI) always beats both.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

/**
 * Migrations must not run through Neon's connection pooler.
 *
 * `prisma migrate` guards itself with a session-level advisory lock
 * (`pg_advisory_lock`). PgBouncer in transaction mode — which is what the
 * `-pooler` endpoint is — doesn't pin a server session across statements, so
 * the lock can never be observed as held and the CLI gives up with P1002.
 *
 * Only the Prisma CLI needs this. The running app keeps using the pooled
 * DATABASE_URL, which is what a serverless runtime wants.
 */
const migrationUrl = (): string | undefined => {
	const explicit = process.env["DIRECT_URL"];
	if (explicit) return explicit;

	const pooled = process.env["DATABASE_URL"];
	if (!pooled) return undefined;

	// Neon names the pooled host `<endpoint>-pooler.<region>…`; the direct
	// endpoint is the same host without that suffix. Anything else is passed
	// through untouched.
	try {
		const url = new URL(pooled);
		const direct = url.hostname.replace("-pooler.", ".");
		if (direct === url.hostname) return pooled;
		url.hostname = direct;
		return url.toString();
	} catch {
		return pooled;
	}
};

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: migrationUrl(),
	},
});
