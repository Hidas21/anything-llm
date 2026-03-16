/**
 * AI Beleegyezés modul – backend végpontok
 *
 * Elkülönített endpoint fájl, amely nem módosít egyetlen meglévő végpontot sem.
 * Gyártói frissítés esetén ez a fájl és a hozzá tartozó modell újra alkalmazható.
 *
 * Végpontok:
 *   GET  /api/ai-consent/policy  – visszaadja az ai_consent.md szövegét
 *   GET  /api/ai-consent/status  – lekérdezi, hogy az aktuális felhasználó elfogadta-e
 *   POST /api/ai-consent/accept  – elmenti az elfogadást az adatbázisba
 */

const path = require("path");
const fs = require("fs");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { userFromSession } = require("../utils/http");
const { AiConsent } = require("../models/aiConsent");

// Az ai_consent.md a projekt gyökerében van (server/ szülőkönyvtárában)
const POLICY_FILE_PATH = path.resolve(__dirname, "../../ai_consent.md");

function aiConsentEndpoints(router) {
  /**
   * Visszaadja a beleegyező nyilatkozat szövegét (markdown).
   * Nyilvános végpont – authentikáció nem szükséges a szöveg megtekintéséhez.
   */
  router.get("/ai-consent/policy", async (_request, response) => {
    try {
      if (!fs.existsSync(POLICY_FILE_PATH)) {
        return response
          .status(404)
          .json({ error: "A beleegyező nyilatkozat fájlja nem található." });
      }
      const content = fs.readFileSync(POLICY_FILE_PATH, "utf-8");
      response.status(200).json({ content });
    } catch (e) {
      console.error("[AI Consent] policy read error:", e.message);
      response.status(500).json({ error: e.message });
    }
  });

  /**
   * Ellenőrzi, hogy az aktuálisan bejelentkezett felhasználó elfogadta-e a nyilatkozatot.
   * Egyszemélyes módban (nincs userId) mindig true-t ad vissza.
   */
  router.get(
    "/ai-consent/status",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          // Egyszemélyes mód – nincs felhasználói fiók, nem szükséges beleegyezés
          return response.status(200).json({ accepted: true });
        }
        const accepted = await AiConsent.hasAccepted(user.id);
        response.status(200).json({ accepted });
      } catch (e) {
        console.error("[AI Consent] status check error:", e.message);
        response.status(500).json({ error: e.message });
      }
    }
  );

  /**
   * Elmenti a felhasználó beleegyezését az adatbázisba.
   * Tárolja: userId, elfogadás időpontja (acceptedAt), szabályzat verziója (policyVersion).
   */
  router.post(
    "/ai-consent/accept",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          // Egyszemélyes mód – nincs mit menteni
          return response.status(200).json({ success: true });
        }
        const consent = await AiConsent.accept(user.id);
        response.status(200).json({ success: true, consent });
      } catch (e) {
        console.error("[AI Consent] accept error:", e.message);
        response.status(500).json({ error: e.message });
      }
    }
  );
}

module.exports = { aiConsentEndpoints };
