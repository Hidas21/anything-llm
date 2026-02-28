import { useEffect, useState } from "react";
import { BookBookmark } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import PromptLibraryV2Api from "@/models/promptLibraryV2";

/**
 * Chat input icon button.
 * Dispatches `prompt-library-v2:open` so ChatContainer renders the form
 * in the chat area — no tight coupling, no form-submit risk.
 */
export default function PromptLibraryV2Button({ workspaceSlug }) {
  const [hasLibraries, setHasLibraries] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    PromptLibraryV2Api.forWorkspace(workspaceSlug)
      .then((libs) => setHasLibraries(Array.isArray(libs) && libs.length > 0))
      .catch(() => setHasLibraries(false));
  }, [workspaceSlug]);

  if (!hasLibraries) return null;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("prompt-library-v2:open", { detail: { workspaceSlug } })
          )
        }
        data-tooltip-id="plv2-btn-tooltip"
        data-tooltip-content="Prompt Library"
        aria-label="Open Prompt Library"
        className="border-none relative flex justify-center items-center opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60 cursor-pointer"
      >
        <BookBookmark
          className="w-[20px] h-[20px] pointer-events-none text-[var(--theme-sidebar-footer-icon-fill)]"
          weight="regular"
        />
      </button>
      <Tooltip
        id="plv2-btn-tooltip"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </>
  );
}
