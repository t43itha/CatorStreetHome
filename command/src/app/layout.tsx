import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { IconSprite } from "@/components/Icons.tsx";
import { ConvexClientProvider } from "@/components/ConvexClientProvider.tsx";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-newsreader" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

export const metadata: Metadata = {
  title: "Command · Cator Street",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${newsreader.variable} ${hanken.variable}`}>
      <body>
        <IconSprite />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
