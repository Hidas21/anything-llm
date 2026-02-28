import { useState } from "react";
import { BookBookmark } from "@phosphor-icons/react";
import usePromptLibraryV2 from "@/hooks/usePromptLibraryV2";
import BottomPanel from "./BottomPanel";

/**
 * PromptLibraryV2 — self-contained mount point.
 *
 * Drop this anywhere inside WorkspaceChat with:
 *   <PromptLibraryV2 workspace={workspace} />
 *
 * It renders:
 *   1. A slim trigger bar at the top of the chat area
 *   2. The slide-up BottomPanel (lazy — only when open)
 *
 * Communication with ChatContainer happens via a custom DOM event
 * `prompt-library-v2:generate` — no props or callbacks needed.
 */
export default function PromptLibraryV2({ workspace }) {
  const { libraries, loading } = usePromptLibraryV2(workspace);
  const [open, setOpen] = useState(false);

  // Don't render anything until workspace is ready
  if (!workspace) return null;

  return (
    <>
      {/* ── Trigger bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-x-2 px-4 py-1.5 border-b border-white/10 shrink-0 bg-theme-bg-secondary">
        <BookBookmark
          className="h-4 w-4 text-theme-text-secondary shrink-0"
          weight="regular"
        />
        <span className="text-xs text-theme-text-secondary">
          {loading
            ? "Loading libraries…"
            : libraries.length === 0
            ? "No prompt libraries available"
            : `${libraries.length} prompt librar${libraries.length === 1 ? "y" : "ies"} available`}
        </span>
        {!loading && libraries.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Use template
          </button>
        )}
      </div>

      {/* ── Bottom panel (lazy) ─────────────────────────────────────────── */}
      {open && (
        <BottomPanel
          libraries={libraries}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
