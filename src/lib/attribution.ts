// Where a visitor came from, remembered so a registration or application days later can be credited to the right post.
// First touch (what first brought them) and last touch (what brought them back) are kept in two small cookies, so the
// server can read them on any request without the forms having to pass anything along.

export type Touch = {
  /** source, e.g. "linkedin" */
  s: string;
  /** medium, e.g. "social" */
  m: string | null;
  /** campaign */
  c: string | null;
  /** content: the short code of the role or post */
  k: string | null;
  /** referrer host */
  r: string | null;
  /** landing path */
  p: string;
  at: number;
};

export const FIRST_COOKIE = "sa_first";
export const LAST_COOKIE = "sa_last";
export const VISITOR_COOKIE = "sa_vid";

const BY_HOST: [RegExp, string][] = [
  [/(^|\.)(staffanchor\.com)$/, "staffanchor-site"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(instagram\.com)$/, "instagram"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "x"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(google\.[a-z.]+)$/, "google"],
  [/(^|\.)(bing\.com)$/, "bing"],
  [/(^|\.)(naukri\.com)$/, "naukri"],
  [/(^|\.)(indeed\.[a-z.]+)$/, "indeed"],
];

const slug = (v: string | null | undefined, max = 60) => {
  const t = (v ?? "").trim().toLowerCase().replace(/[^a-z0-9_\-.:]+/g, "-").replace(/^-+|-+$/g, "");
  return t ? t.slice(0, max) : null;
};

/** What this page view says about where the visitor came from, or null when it is just moving around the site. */
export function classifyTouch(input: { search: string; pathname: string; referrer: string; ownHost: string }): Touch | null {
  const params = new URLSearchParams(input.search);
  const code = /^\/[jl]\/([a-z0-9]{4,12})/i.exec(input.pathname)?.[1]?.toLowerCase() ?? null;
  let refHost: string | null = null;
  try {
    refHost = input.referrer ? new URL(input.referrer).hostname.toLowerCase() : null;
  } catch {
    refHost = null;
  }
  if (refHost && refHost === input.ownHost) refHost = null;

  const utmSource = slug(params.get("utm_source"));
  if (utmSource) {
    return { s: utmSource, m: slug(params.get("utm_medium")), c: slug(params.get("utm_campaign")), k: slug(params.get("utm_content")) ?? code, r: refHost, p: input.pathname.slice(0, 120), at: Date.now() };
  }
  // /l/<code> is the short link used on LinkedIn posts.
  if (input.pathname.startsWith("/l/")) return { s: "linkedin", m: "social", c: "post", k: code, r: refHost, p: input.pathname.slice(0, 120), at: Date.now() };
  if (refHost) {
    const known = BY_HOST.find(([re]) => re.test(refHost!))?.[1];
    return { s: known ?? refHost, m: known === "google" || known === "bing" ? "organic" : "referral", c: null, k: code, r: refHost, p: input.pathname.slice(0, 120), at: Date.now() };
  }
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax`;
}

export function parseTouch(raw: string | null | undefined): Touch | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Partial<Touch>;
    if (typeof t.s !== "string" || !t.s) return null;
    return { s: t.s.slice(0, 60), m: t.m ?? null, c: t.c ?? null, k: t.k ?? null, r: t.r ?? null, p: typeof t.p === "string" ? t.p.slice(0, 120) : "/", at: typeof t.at === "number" ? t.at : 0 };
  } catch {
    return null;
  }
}

/** Runs once per browser session, on the first page. Returns the touch to report, if there is one worth reporting. */
export function captureLanding(): { visitorId: string; touch: Touch } | null {
  if (typeof window === "undefined") return null;
  try {
    if (sessionStorage.getItem("sa_landed")) return null;
    sessionStorage.setItem("sa_landed", "1");
  } catch {
    // Storage blocked: still capture, once per page load.
  }
  let visitorId = readCookie(VISITOR_COOKIE);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    writeCookie(VISITOR_COOKIE, visitorId, 365);
  }
  const found = classifyTouch({ search: window.location.search, pathname: window.location.pathname, referrer: document.referrer, ownHost: window.location.hostname });
  const first = parseTouch(readCookie(FIRST_COOKIE));
  // Someone typing the address, or opening a link from a chat app, has no referrer: record it as direct.
  const touch: Touch = found ?? { s: "direct", m: null, c: null, k: /^\/[jl]\/([a-z0-9]{4,12})/i.exec(window.location.pathname)?.[1]?.toLowerCase() ?? null, r: null, p: window.location.pathname.slice(0, 120), at: Date.now() };
  // First touch: keep the first real source. A "direct" visit is only a placeholder until something better shows up.
  if (!first || (first.s === "direct" && touch.s !== "direct")) writeCookie(FIRST_COOKIE, JSON.stringify(touch), 90);
  // Last touch: any real source replaces it; direct only fills an empty slot.
  const last = parseTouch(readCookie(LAST_COOKIE));
  if (touch.s !== "direct" || !last) writeCookie(LAST_COOKIE, JSON.stringify(touch), 30);
  return { visitorId, touch };
}
