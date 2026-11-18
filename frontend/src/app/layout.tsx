import type { Metadata, Viewport } from "next";
import { Archivo_Black, Libre_Franklin } from "next/font/google";
import "./globals.css";

// Polices de L'Burn / Les BURN'ettes : Libre Franklin (texte), Archivo Black (titres).
// Les noms de variables --font-inter / --font-space sont conservés pour globals.css.
const texte = Libre_Franklin({ variable: "--font-inter", subsets: ["latin"] });
const titre = Archivo_Black({ variable: "--font-space", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Fil ACTIV'",
  description: "Ma feuille de route ACTIV', à mon rythme.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#DC3129" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${texte.variable} ${titre.variable}`}>
      <body>{children}</body>
    </html>
  );
}
