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
        {/* Version indicator - for cf-pages-hosted: clean NAS re-extraction (lossless per principle), pre-configured TMDB via CF secret, full experience */}
        <div className="fixed bottom-1 right-2 text-[9px] text-white/20 font-mono pointer-events-none select-none">
          v2.0.0-hosted (clean re-extraction + pre-configured TMDB)
        </div>
      </body>
    </html>
  );
}
