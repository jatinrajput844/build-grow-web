const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomAlias(length = 6) {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function shortUrl(alias: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/${alias}`;
}

export function money(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(4)}`;
}

export function money2(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

/** Best-effort visitor country detection for payout rates. */
export async function detectCountry(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = (await res.json()) as { country_code?: string };
      if (data.country_code) return data.country_code.toUpperCase();
    }
  } catch {
    /* ignore */
  }
  try {
    const locale = navigator.language;
    const region = locale.split("-")[1];
    if (region) return region.toUpperCase();
  } catch {
    /* ignore */
  }
  return "XX";
}

export function deviceType() {
  if (typeof navigator === "undefined") return "unknown";
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop";
}
