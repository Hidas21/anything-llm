/**
 * AI Beleegyezés modul – teljes képernyős beleegyező modal
 *
 * A nyilatkozat szövege közvetlenül a komponensbe van bundlözve (ai_consent.md),
 * nem a host gépről kerül betöltésre.
 */

import { useState } from "react";
import AiConsent from "@/models/aiConsent";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "dompurify";
import policyMarkdown from "./ai_consent.md?raw";

const policyHtml = DOMPurify.sanitize(renderMarkdown(policyMarkdown));

export default function AiConsentModal({ onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    if (!agreed || loading) return;
    setLoading(true);
    setError(null);
    const { success } = await AiConsent.accept();
    if (success) {
      onAccepted();
    } else {
      setError(
        "Hiba történt az elfogadás mentése során. Kérjük próbálja újra."
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="relative w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl"
        style={{
          backgroundColor: "#ffffff",
          maxHeight: "90vh",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Header */}
        <div
          className="px-8 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>
            AI Beleegyezési Nyilatkozat
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            A rendszer használatához el kell fogadnia az alábbi nyilatkozatot.
          </p>
        </div>

        {/* Policy content – scrollable */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6"
          style={{ minHeight: 0 }}
        >
          <div
            className="ai-consent-body"
            dangerouslySetInnerHTML={{ __html: policyHtml }}
          />
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 flex-shrink-0 space-y-4"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
          )}

          <label
            className="flex items-start gap-3 cursor-pointer"
            style={{ userSelect: "none" }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer"
              style={{ accentColor: "#2563eb" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#374151" }}>
              Elolvastam, megértettem és elfogadom a fenti AI Rendszerhasználati
              és Beleegyező Nyilatkozatban foglalt feltételeket.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || loading}
            style={{
              width: "100%",
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 500,
              fontSize: "0.875rem",
              color: "#ffffff",
              backgroundColor: agreed && !loading ? "#2563eb" : "#93c5fd",
              cursor: agreed && !loading ? "pointer" : "not-allowed",
              border: "none",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Mentés..." : "Elfogadom"}
          </button>
        </div>
      </div>

      <style>{`
        .ai-consent-body {
          color: #1f2937;
          font-size: 0.875rem;
          line-height: 1.75;
        }
        .ai-consent-body h1 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #111827;
          margin: 1.25rem 0 0.5rem;
        }
        .ai-consent-body h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 1.25rem 0 0.4rem;
        }
        .ai-consent-body h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1rem 0 0.3rem;
        }
        .ai-consent-body p {
          margin: 0.5rem 0;
          color: #1f2937;
        }
        .ai-consent-body ul,
        .ai-consent-body ol {
          padding-left: 1.5rem;
          margin: 0.4rem 0;
        }
        .ai-consent-body li {
          margin: 0.25rem 0;
          color: #1f2937;
        }
        .ai-consent-body strong {
          color: #111827;
          font-weight: 600;
        }
        .ai-consent-body hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1rem 0;
        }
        .ai-consent-body blockquote {
          border-left: 3px solid #d97706;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #92400e;
          background-color: #fffbeb;
          padding: 0.5rem 1rem;
          border-radius: 0 0.25rem 0.25rem 0;
        }
        .ai-consent-body a {
          color: #2563eb;
          text-decoration: underline;
        }
        .ai-consent-body code {
          background: #f3f4f6;
          color: #1f2937;
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
