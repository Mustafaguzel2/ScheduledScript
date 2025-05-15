import type { Metadata } from "next";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";
import { ToastProvider } from "../components/ui/toast";
import { Toaster } from "../components/ui/toaster";
import { ThemeProvider } from "../components/theme-provider";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | X-Ops",
    default: "X-Ops",
  },
  description: "An integration platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <ToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="xops-theme"
          >
            <Providers>
              {children}
            </Providers>
          </ThemeProvider>
        </ToastProvider>
        <Toaster />
        <SonnerToaster position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
