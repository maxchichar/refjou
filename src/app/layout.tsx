import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "refjou — reflect daily, grow visibly",
  description:
    "A daily reflection journal you can share. Track your streak, log your habits, and grow in public.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
