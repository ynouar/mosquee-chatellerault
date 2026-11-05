import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

function timingSafePinMatch(supplied, expected) {
  if (typeof supplied !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sanitizeString(val, maxLen = 500) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

function sanitizeMosqueePayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  const urgentBanner = {
    enabled: Boolean(raw.urgentBanner?.enabled),
    tag: sanitizeString(raw.urgentBanner?.tag, 80),
    message: sanitizeString(raw.urgentBanner?.message, 400)
  };

  const prayerSettings = {
    jumuaTime: sanitizeString(raw.prayerSettings?.jumuaTime || "13:00", 10),
    iqamaOffsets: {
      Fajr: Math.min(60, Math.max(0, Number(raw.prayerSettings?.iqamaOffsets?.Fajr) || 10)),
      Dhuhr: Math.min(60, Math.max(0, Number(raw.prayerSettings?.iqamaOffsets?.Dhuhr) || 10)),
      Asr: Math.min(60, Math.max(0, Number(raw.prayerSettings?.iqamaOffsets?.Asr) || 10)),
      Maghrib: Math.min(60, Math.max(0, Number(raw.prayerSettings?.iqamaOffsets?.Maghrib) || 5)),
      Isha: Math.min(60, Math.max(0, Number(raw.prayerSettings?.iqamaOffsets?.Isha) || 10))
    }
  };

  const projectFund = {
    title: sanitizeString(raw.projectFund?.title, 140),
    description: sanitizeString(raw.projectFund?.description, 600),
    raisedAmount: Math.max(0, Number(raw.projectFund?.raisedAmount) || 0),
    goalAmount: Math.max(1, Number(raw.projectFund?.goalAmount) || 1)
  };

  const rawAnns = Array.isArray(raw.announcements) ? raw.announcements.slice(0, 12) : [];
  const announcements = rawAnns.map((ann) => {
    const clean = {
      category: sanitizeString(ann?.category, 60),
      date: sanitizeString(ann?.date, 60),
      title: sanitizeString(ann?.title, 140),
      body: sanitizeString(ann?.body, 800)
    };
    if (typeof ann?.image === "string" && /^assets\/[a-zA-Z0-9._/-]+$/.test(ann.image.trim())) {
      clean.image = ann.image.trim();
    }
    return clean;
  });

  return { urgentBanner, prayerSettings, projectFund, announcements };
}

export default async (req) => {
  const store = getStore("mosquee-assalam-store");

  if (req.method === "GET") {
    try {
      const data = await store.get("live-mosquee-data", { type: "json" });
      return Response.json({ ok: true, data: data || null });
    } catch {
      return Response.json({ ok: false, data: null }, { status: 200 });
    }
  }

  if (req.method === "POST") {
    try {
      const expectedPin = Netlify.env.get("MOSQUEE_ADMIN_PIN");
      if (!expectedPin) {
        return Response.json(
          { ok: false, error: "MOSQUEE_ADMIN_PIN non configuré sur le serveur." },
          { status: 503 }
        );
      }

      const body = await req.json();
      if (!body || !timingSafePinMatch(String(body.pin || ""), expectedPin)) {
        return Response.json({ ok: false, error: "Code responsable invalide" }, { status: 401 });
      }

      const cleanData = sanitizeMosqueePayload(body.data);
      if (!cleanData) {
        return Response.json({ ok: false, error: "Format de données invalide" }, { status: 400 });
      }

      await store.setJSON("live-mosquee-data", cleanData);
      return Response.json({ ok: true, savedAt: new Date().toISOString() });
    } catch {
      return Response.json({ ok: false, error: "Erreur serveur lors de la sauvegarde" }, { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = {
  path: "/api/mosquee-data"
};
