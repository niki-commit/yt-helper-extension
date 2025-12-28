import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Next.js 16 supports this out of the box
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Note Hub | Video Notes Sync",
  description:
    "Sync your YouTube study notes across all your devices with VideoNotes extension.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-zinc-50 dark:bg-black antialiased`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
