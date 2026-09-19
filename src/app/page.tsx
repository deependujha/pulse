"use client";

import { useSession } from "next-auth/react";
import { LoginPage } from "@/components/pages/login/login";
import { TrackerPage } from "@/components/pages/tracker/tracker";

export default function Home() {
	const { data: session, status } = useSession();

	if (status === "loading") {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background">
				<img src="/logo.svg" alt="pulse" className="size-12 animate-pulse opacity-60" />
			</div>
		);
	}

	if (!session) return <LoginPage />;

	return <TrackerPage />;
}
