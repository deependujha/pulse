"use client";

import { signIn } from "next-auth/react";

const HIGHLIGHTS = [
	{ emoji: "🏋️", title: "Workouts you build", body: "Your movements, your sets, your week." },
	{ emoji: "🍽️", title: "Calories that add up", body: "Tap what you ate. Watch the deficit build." },
	{ emoji: "🧴", title: "Routines that stick", body: "Morning, night, and the 3x-a-week stuff." },
];

export const LoginPage = () => {
	return (
		<div className="safe-top safe-bottom flex min-h-[100dvh] flex-col px-6 py-10">
			<div className="flex flex-1 flex-col items-center justify-center text-center">
				<div className="mb-6 grid size-24 place-items-center rounded-3xl bg-secondary">
					<img src="/logo.svg" alt="" className="size-14" />
				</div>

				<h1 className="text-3xl font-semibold tracking-tight">pulse</h1>
				<p className="mt-2 max-w-xs text-sm text-muted-foreground">
					Workouts, nutrition and daily care — in one private place.
				</p>

				<ul className="mt-8 w-full max-w-sm space-y-2.5 text-left">
					{HIGHLIGHTS.map((item) => (
						<li
							key={item.title}
							className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3"
						>
							<span className="text-xl" aria-hidden="true">
								{item.emoji}
							</span>
							<span>
								<span className="block text-sm font-medium">{item.title}</span>
								<span className="block text-xs text-muted-foreground">{item.body}</span>
							</span>
						</li>
					))}
				</ul>
			</div>

			<div className="flex flex-col items-center">
				<button
					type="button"
					onClick={() => signIn("google")}
					className="flex min-h-13 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-foreground py-3.5 font-medium text-background transition active:scale-[0.99]"
				>
					<img src="/google.svg" alt="" className="size-5" />
					Continue with Google
				</button>

				<p className="mt-5 max-w-xs text-center text-xs text-muted-foreground">
					No ads. No noise. Your data stays yours.
				</p>
			</div>
		</div>
	);
};
