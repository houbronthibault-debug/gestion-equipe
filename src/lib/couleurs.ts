export function assombrirCouleur(hex: string, ratio = 0.25): string {
  const normalise = hex.replace("#", "");
  const bigint = parseInt(normalise, 16);
  const r = Math.max(0, Math.round(((bigint >> 16) & 255) * (1 - ratio)));
  const g = Math.max(0, Math.round(((bigint >> 8) & 255) * (1 - ratio)));
  const b = Math.max(0, Math.round((bigint & 255) * (1 - ratio)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function eclaircirCouleur(hex: string, ratio = 0.78): string {
  const normalise = hex.replace("#", "");
  const bigint = parseInt(normalise, 16);
  const melange = (canal: number) =>
    Math.round(canal + (255 - canal) * ratio);
  const r = melange((bigint >> 16) & 255);
  const g = melange((bigint >> 8) & 255);
  const b = melange(bigint & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
