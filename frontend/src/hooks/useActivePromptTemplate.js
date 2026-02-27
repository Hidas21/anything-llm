import { useState, useEffect, useCallback } from "react";
import PromptLibrary from "@/models/promptLibrary";

export default function useActivePromptTemplate(workspace) {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    if (!workspace?.slug) {
      setActiveTemplate(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const template = await PromptLibrary.getActive(workspace.slug);
    setActiveTemplate(template);
    setLoading(false);
  }, [workspace?.slug]);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  return { activeTemplate, setActiveTemplate, loading, refetch: fetchActive };
}
