// Utilities for normalizing and matching email subjects

export function normalizeText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function subjectContainsKeyword(subject: string, keywords: string[]): boolean {
  const normalizedSubject = normalizeText(subject);
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword && normalizedSubject.includes(normalizedKeyword)) {
      return true;
    }
  }
  return false;
}

// Decode RFC 2047 encoded-words in headers like:
// =?UTF-8?B?...?= or =?UTF-8?Q?...?=
export function decodeRfc2047Header(text: string): string {
  if (!text) return "";
  const encodedWordRegex = /=\?([^?]+)\?([bBqQ])\?([^?]+)\?=/g;
  return text.replace(encodedWordRegex, (_match, _charset: string, enc: string, data: string) => {
    const encoding = enc.toUpperCase();
    try {
      if (encoding === "B") {
        return Buffer.from(data, "base64").toString("utf8");
      }
      // Q-encoding for headers (underscore represents space)
      const qp = data.replace(/_/g, " ");
      // Convert =HH to %HH and decode as UTF-8
      const percentEncoded = qp.replace(/=([0-9A-Fa-f]{2})/g, "%$1");
      try {
        return decodeURIComponent(percentEncoded);
      } catch {
        // Fallback: leave as-is if decoding fails
        return qp;
      }
    } catch {
      return data;
    }
  });
}

export function extractSubjectFromPublicData(
  publicData: Record<string, string[] | string> | undefined
): string | undefined {
  if (!publicData || typeof publicData !== "object") return undefined;
  const subjectKey = Object.keys(publicData).find((k) => k.toLowerCase().includes("subject"));
  if (!subjectKey) return undefined;
  const raw = (publicData as Record<string, string[] | string>)[subjectKey];
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return undefined;
  return decodeRfc2047Header(first).trim();
}
