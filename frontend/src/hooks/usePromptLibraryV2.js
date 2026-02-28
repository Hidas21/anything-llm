/**
 * Hook: load Prompt Library V2 libraries for the current workspace.
 */
import { useEffect, useState, useCallback } from "react";
import PromptLibraryV2 from "@/models/promptLibraryV2";

/**
 * @param {Object|null} workspace  - the current workspace object (needs .slug)
 * @returns {{ libraries, loading, refetch }}
 */
export default function usePromptLibraryV2(workspace) {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!workspace?.slug) return;
    setLoading(true);
    const data = await PromptLibraryV2.forWorkspace(workspace.slug);
    setLibraries(data);
    setLoading(false);
  }, [workspace?.slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { libraries, loading, refetch };
}
