import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fil ACTIV' · Accompagnante",
  robots: { index: false },
};

export default function AccompagnanteLayout({ children }: { children: ReactNode }) {
  return children;
}
