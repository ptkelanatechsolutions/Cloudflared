import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloudflared | Tunnel Control",
  description: "Self-hosted control panel for your Cloudflare tunnel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col overflow-hidden">
        <a
          href="#main-content"
          className="fixed top-2 left-2 z-[100] -translate-y-[200%] rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster
          richColors
          closeButton
          position="bottom-right"
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
