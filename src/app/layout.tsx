import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "refjou — reflect daily, grow visibly",
  description:
    "A daily reflection journal you can share. Track your streak, log your habits, and grow in public.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "refjou",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14171f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <ServiceWorkerRegister />
        <Navbar />
        <main className="flex-1">{children}</main>
        <InstallPrompt />
      </body>
    </html>
  );
}
