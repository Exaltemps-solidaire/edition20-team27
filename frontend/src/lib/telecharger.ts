// Téléchargement d'un fichier généré côté client (navigateur uniquement).

export function telechargerFichier(nom: string, contenu: string, type = "text/calendar;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
