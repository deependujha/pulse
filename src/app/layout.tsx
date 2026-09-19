import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";
import { OAuthProviderWrapper } from "@/components/oauth-provider/oauth-provider-wrapper";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "pulse",
	description:
		"A private, online space to track workouts, nutrition, and daily care routines. No ads. No Noise. your data stays yours.",
	icons: {
		icon: [
			{ url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: "/favicon/apple-touch-icon.png",
	},
	manifest: "/favicon/site.webmanifest",
	appleWebApp: {
		capable: true,
		title: "pulse",
		statusBarStyle: "black-translucent",
	},
	other: {
		// Next 16 emits only the standardised `mobile-web-app-capable`, but iOS
		// honours `apple-mobile-web-app-status-bar-style` only when the
		// Apple-prefixed tag is present too. Without it the status bar style is
		// ignored, iOS insets the web view top and bottom, and `viewport-fit=cover`
		// never gets the full screen.
		"apple-mobile-web-app-capable": "yes",
	},
};

export const viewport: Viewport = {
	// `viewportFit: cover` lets the app paint under the notch and home
	// indicator; the shell adds the safe-area padding back where it matters.
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<OAuthProviderWrapper>{children}</OAuthProviderWrapper>
				<Toaster position="top-center" richColors closeButton />
				<Analytics />
			</body>
		</html>
	);
}
