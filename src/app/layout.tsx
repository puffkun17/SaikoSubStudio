import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SystemTray } from "@/components/Global/SystemTray";

export const metadata: Metadata = {
  title: "SaikoSubStudio",
  description: "Tool for aligning, merging and styling bilingual subtitles with cinema preview simulator.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-[#050507] text-white">
        <SystemTray />
        <div className="pt-14 min-h-[calc(100dvh-56px)]">
          {children}
        </div>
      </body>
    </html>
  );
}
