// Génération de fichiers agenda (.ics, RFC 5545) côté client : fonctions pures.

/** Heure « murale » à Paris (pas de conversion de fuseau : l'agenda s'en charge via TZID). */
export type HeureParis = { annee: number; mois: number; jour: number; heure: number; minute: number };

export type EvenementIcs = {
  uid: string;
  titre: string;
  debut: HeureParis;
  fin: HeureParis;
  lieu?: string;
  description?: string;
};

export const ATELIER_COLLECTIF: EvenementIcs = {
  uid: "atelier-collectif-20261120@filactiv",
  titre: "Atelier collectif ACTIV'",
  debut: { annee: 2026, mois: 11, jour: 20, heure: 14, minute: 0 },
  fin: { annee: 2026, mois: 11, jour: 20, heure: 16, minute: 0 },
  lieu: "Au local de l'association",
};

const VTIMEZONE_PARIS = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const deux = (n: number) => String(n).padStart(2, "0");

function heureLocale(h: HeureParis): string {
  return `${h.annee}${deux(h.mois)}${deux(h.jour)}T${deux(h.heure)}${deux(h.minute)}00`;
}

function horodatageUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Échappe un texte selon RFC 5545 (antislash, point-virgule, virgule, retour à la ligne). */
export function echapperTexte(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Replie une ligne à 75 octets (UTF-8), sans couper un caractère. */
export function replier(ligne: string): string {
  const morceaux: string[] = [];
  let courant = "";
  let octets = 0;
  const encodeur = new TextEncoder();
  for (const c of ligne) {
    const n = encodeur.encode(c).length;
    const limite = morceaux.length === 0 ? 75 : 74; // les lignes de suite commencent par une espace
    if (octets + n > limite) {
      morceaux.push(courant);
      courant = "";
      octets = 0;
    }
    courant += c;
    octets += n;
  }
  morceaux.push(courant);
  return morceaux.join("\r\n ");
}

export function genererIcs(e: EvenementIcs, maintenant: Date = new Date()): string {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//L'Burn//Fil ACTIV'//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_PARIS,
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${horodatageUtc(maintenant)}`,
    `DTSTART;TZID=Europe/Paris:${heureLocale(e.debut)}`,
    `DTEND;TZID=Europe/Paris:${heureLocale(e.fin)}`,
    `SUMMARY:${echapperTexte(e.titre)}`,
    ...(e.lieu ? [`LOCATION:${echapperTexte(e.lieu)}`] : []),
    ...(e.description ? [`DESCRIPTION:${echapperTexte(e.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lignes.map(replier).join("\r\n") + "\r\n";
}

const MOIS: Record<string, number> = {
  janv: 1, janvier: 1, févr: 2, fevr: 2, février: 2, fevrier: 2, mars: 3, avr: 4, avril: 4, mai: 5, juin: 6,
  juil: 7, juillet: 7, août: 8, aout: 8, sept: 9, septembre: 9, oct: 10, octobre: 10, nov: 11, novembre: 11,
  déc: 12, dec: 12, décembre: 12, decembre: 12,
};

const CRENEAU =
  /(\d{1,2})\s+([a-zéû]+)\.?,?\s+(\d{1,2})\s*h\s*(\d{2})?\s*(?:→|->|-|à)\s*(\d{1,2})\s*h\s*(\d{2})?/i;

/**
 * Cherche un créneau précis (« Jeudi 20 nov., 13 h 45 → 15 h 15 ») dans la ligne « Quand » des détails.
 * Renvoie `null` si la date est vague (« Quand tu veux cette semaine »).
 * L'année est déduite de `maintenant` : une date passée de plus de 60 jours est placée l'année suivante.
 */
export function creneauDepuisDetails(details: [string, string][], maintenant: Date = new Date()): { debut: HeureParis; fin: HeureParis } | null {
  const quand = details.find(([k]) => k.toLowerCase() === "quand")?.[1];
  const r = quand ? CRENEAU.exec(quand) : null;
  if (!r) return null;
  const mois = MOIS[r[2].toLowerCase()];
  const jour = Number(r[1]);
  if (!mois || jour < 1 || jour > 31) return null;
  let annee = maintenant.getFullYear();
  if (new Date(annee, mois - 1, jour).getTime() < maintenant.getTime() - 60 * 86_400_000) annee += 1;
  const debut = { annee, mois, jour, heure: Number(r[3]), minute: Number(r[4] ?? 0) };
  const fin = { annee, mois, jour, heure: Number(r[5]), minute: Number(r[6] ?? 0) };
  if (debut.heure > 23 || fin.heure > 23 || debut.minute > 59 || fin.minute > 59) return null;
  return { debut, fin };
}
