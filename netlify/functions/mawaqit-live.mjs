// Proxy temps réel vers https://mawaqit.net/fr/m/essalem-chatellerault
export default async (req) => {
  try {
    const res = await fetch("https://mawaqit.net/fr/m/essalem-chatellerault", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: `Mawaqit status ${res.status}` }, { status: 200 });
    }
    const html = await res.text();
    const match = html.match(/(?:let|var|const)\s+confData\s*=\s*(\{[\s\S]*?\});/);
    if (!match) {
      return Response.json({ ok: false, error: "confData introuvable" }, { status: 200 });
    }
    const conf = JSON.parse(match[1]);
    return Response.json(
      { ok: true, source: "mawaqit-live", conf },
      {
        headers: {
          "Cache-Control": "public, max-age=300"
        }
      }
    );
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 200 });
  }
};

export const config = {
  path: "/api/mawaqit"
};
