// Zugangsschutz auf der eigenen Adresse.
//
// Warum nicht Cloudflare Access: Access leitet auf eine fremde Login-Domain um.
// Ein Service Worker darf für eine Navigation keine umgeleitete Antwort
// zurückgeben — daran ist die App auf dem Handy wiederholt gescheitert.
// Hier gibt es nie eine Umleitung: entweder 200 mit Inhalt oder 404.
//
// Ablauf: Einmal die Adresse mit ?k=SCHLÜSSEL öffnen. Danach trägt das Gerät
// den Zugang ein Jahr lang als Cookie. Ohne beides existiert die Seite nicht.
//
// Der Schlüssel liegt als Secret ZUGANG im Pages-Projekt und steht nirgends
// im Code oder im Repo.

const COOKIE = "dd_zugang";
const EIN_JAHR = 31536000;

// Zeichenweiser Vergleich ohne vorzeitigen Abbruch, damit die Antwortzeit
// nichts über die Länge der Übereinstimmung verrät.
function gleich(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let unterschied = 0;
  for (let i = 0; i < a.length; i++) unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return unterschied === 0;
}

function cookieWert(kopfzeile, name) {
  for (const teil of (kopfzeile || "").split(";")) {
    const t = teil.trim();
    if (t.startsWith(name + "=")) return t.slice(name.length + 1);
  }
  return null;
}

// Gilt für jede Antwort — auch die 404, damit nichts irgendwo im Index landet.
function mitSchutzkopfzeilen(antwort) {
  antwort.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  antwort.headers.set("Referrer-Policy", "no-referrer");
  antwort.headers.set("X-Content-Type-Options", "nosniff");
  return antwort;
}

export default {
  async fetch(request, env) {
    const schluessel = env.ZUGANG;

    // Ohne gesetztes Secret wäre die App offen. Dann lieber gar nichts ausliefern.
    if (!schluessel) {
      return mitSchutzkopfzeilen(
        new Response("Zugang nicht eingerichtet.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    const url = new URL(request.url);
    const ausUrl = url.searchParams.get("k");
    const ausCookie = cookieWert(request.headers.get("Cookie"), COOKIE);

    const perUrl = ausUrl !== null && gleich(ausUrl, schluessel);
    const perCookie = ausCookie !== null && gleich(ausCookie, schluessel);

    if (!perUrl && !perCookie) {
      // 404 statt 403: bestätigt nicht einmal, dass hier etwas liegt.
      return mitSchutzkopfzeilen(
        new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    // Den Schlüssel nicht an die Dateiauslieferung durchreichen — sonst landet
    // er im Cache-Schlüssel des Service Workers und damit im Gerätespeicher.
    url.searchParams.delete("k");
    const roh = await env.ASSETS.fetch(new Request(url, request));
    // Kopie, weil die Kopfzeilen der Originalantwort unveränderlich sind.
    const antwort = mitSchutzkopfzeilen(new Response(roh.body, roh));

    if (!perCookie) {
      antwort.headers.append(
        "Set-Cookie",
        `${COOKIE}=${schluessel}; Path=/; Max-Age=${EIN_JAHR}; HttpOnly; Secure; SameSite=Lax`,
      );
    }
    return antwort;
  },
};
