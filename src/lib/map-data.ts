export type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  href: string;
  products: { name: string; href: string }[];
};

export function coordinates(lat: unknown, lng: unknown): [number, number] | null {
  const numeric = (value: unknown) => typeof value === "number" || (typeof value === "string" && value.trim() !== "");
  if (!numeric(lat) || !numeric(lng)) return null;
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && (a !== 0 || b !== 0) ? [a, b] : null;
}

export function safeMapLink(value: unknown): string {
  if (typeof value !== "string") return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
