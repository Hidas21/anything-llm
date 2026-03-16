/**
 * AI Beleegyezés modul – backend model
 *
 * Tárolja és lekérdezi a felhasználók AI rendszerhasználati
 * beleegyező nyilatkozatának elfogadási adatait.
 *
 * Elkülönített fájl: gyártói frissítés esetén nem ütközik a meglévő modellekkel.
 */

const prisma = require("../utils/prisma");

const POLICY_VERSION = "AI System Usage and Consent Policy";

const AiConsent = {
  /**
   * Ellenőrzi, hogy az adott felhasználó elfogadta-e már a nyilatkozatot.
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  hasAccepted: async function (userId) {
    const consent = await prisma.ai_consents.findFirst({
      where: { userId },
    });
    return !!consent;
  },

  /**
   * Menti a felhasználó beleegyezését (idempotens: dupla hívás sem hoz létre duplikátumot).
   * @param {number} userId
   * @returns {Promise<object>}
   */
  accept: async function (userId) {
    const existing = await prisma.ai_consents.findFirst({
      where: { userId },
    });
    if (existing) return existing;

    return await prisma.ai_consents.create({
      data: {
        userId,
        policyVersion: POLICY_VERSION,
        acceptedAt: new Date(),
      },
    });
  },

  /**
   * Visszaadja a felhasználó beleegyezési rekordját.
   * @param {number} userId
   * @returns {Promise<object|null>}
   */
  get: async function (userId) {
    return await prisma.ai_consents.findFirst({
      where: { userId },
    });
  },
};

module.exports = { AiConsent };
