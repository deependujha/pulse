"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { DisplayModeSync } from "@/components/common/display-mode";

/** Client-side providers for the whole app: auth session + colour scheme. */
export const OAuthProviderWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				<DisplayModeSync />
				{children}
			</ThemeProvider>
		</SessionProvider>
	);
};
