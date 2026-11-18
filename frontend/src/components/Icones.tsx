import type { ReactNode } from "react";

type Props = { taille?: number; couleur?: string; epaisseur?: number };

function Svg({ taille = 22, couleur = "currentColor", epaisseur = 2, children }: Props & { children: ReactNode }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const Coche = (p: Props) => (
  <Svg taille={16} epaisseur={2.5} {...p}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
);

export const Soleil = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
  </Svg>
);

export const Nuage = (p: Props) => (
  <Svg {...p}>
    <path d="M7 19h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 19z" />
  </Svg>
);

export const Pluie = (p: Props) => (
  <Svg {...p}>
    <path d="M7 15h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 15z" />
    <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
  </Svg>
);

export const Chemin = (p: Props) => (
  <Svg {...p}>
    <path d="M4 19l5-14 6 10 5-7" />
  </Svg>
);

export const Carte = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <path d="M8 10h8M8 14h5" />
  </Svg>
);

export const Cloche = (p: Props) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 20a2 2 0 004 0" />
  </Svg>
);

export const CercleCoche = (p: Props) => (
  <Svg taille={64} couleur="#2F7D6D" epaisseur={1.8} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M7 12l3.5 3.5L17 9" />
  </Svg>
);

const POINTS: [number, number][] = [
  [20, 95],
  [85, 62],
  [150, 50],
  [215, 72],
  [280, 25],
];

/** Illustration de l'accueil : un chemin en 5 étapes, la première mise en avant. */
export function CheminEtapes() {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="120" role="img" aria-label="Un chemin en 5 étapes">
      <path d="M20 95 C 80 95, 90 30, 150 50 S 230 100, 280 25" fill="none" stroke="#D6D3CA" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14" />
      {POINTS.map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r={i ? 9 : 13} fill={i ? "#fff" : "#C42B24"} stroke={i ? "#9EA2B3" : "#fff"} strokeWidth="3" />
      ))}
    </svg>
  );
}
