import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "Fil ACTIV'",
  description: "Ma feuille de route ACTIV', à mon rythme.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4347D9" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
