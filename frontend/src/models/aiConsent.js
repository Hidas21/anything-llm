/**
 * AI Beleegyezés modul – frontend model
 *
 * API hívások az AI beleegyező nyilatkozat kezeléséhez.
 * Elkülönített fájl: gyártói frissítés esetén nem ütközik a meglévő modellekkel.
 */

import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const AiConsent = {
  /**
   * Ellenőrzi, hogy az aktuális felhasználó elfogadta-e a nyilatkozatot.
   * @returns {Promise<{accepted: boolean}>}
   */
  checkStatus: async function () {
    return await fetch(`${API_BASE}/ai-consent/status`, {
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => ({ accepted: res.accepted ?? false }))
      .catch(() => ({ accepted: false }));
  },

  /**
   * Elmenti a felhasználó beleegyezését.
   * @returns {Promise<{success: boolean}>}
   */
  accept: async function () {
    return await fetch(`${API_BASE}/ai-consent/accept`, {
      method: "POST",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => ({ success: res.success ?? false }))
      .catch(() => ({ success: false }));
  },

  /**
   * Lekéri a beleegyező nyilatkozat szövegét (markdown).
   * @returns {Promise<string|null>}
   */
  getPolicy: async function () {
    return await fetch(`${API_BASE}/ai-consent/policy`)
      .then((res) => res.json())
      .then((res) => res.content ?? null)
      .catch(() => null);
  },
};

export default AiConsent;
