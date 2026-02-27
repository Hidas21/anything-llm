import React, { useEffect, useState } from "react";
import { default as WorkspaceChatContainer } from "@/components/WorkspaceChat";
import Sidebar from "@/components/Sidebar";
import { useParams } from "react-router-dom";
import Workspace from "@/models/workspace";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { isMobile } from "react-device-detect";
import { FullScreenLoader } from "@/components/Preloader";
import { LAST_VISITED_WORKSPACE } from "@/utils/constants";
import useActivePromptTemplate from "@/hooks/useActivePromptTemplate";
import PromptLibraryDrawer from "@/components/PromptLibrary/PromptLibraryDrawer";
import { BookBookmark } from "@phosphor-icons/react";

export default function WorkspaceChat() {
  const { loading, requiresAuth, mode } = usePasswordModal();

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false) {
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;
  }

  return <ShowWorkspaceChat />;
}

function ShowWorkspaceChat() {
  const { slug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const { activeTemplate, setActiveTemplate } =
    useActivePromptTemplate(workspace);

  useEffect(() => {
    async function getWorkspace() {
      if (!slug) return;
      const _workspace = await Workspace.bySlug(slug);
      if (!_workspace) return setLoading(false);

      const suggestedMessages = await Workspace.getSuggestedMessages(slug);
      const pfpUrl = await Workspace.fetchPfp(slug);
      setWorkspace({
        ..._workspace,
        suggestedMessages,
        pfpUrl,
      });
      setLoading(false);
      localStorage.setItem(
        LAST_VISITED_WORKSPACE,
        JSON.stringify({
          slug: _workspace.slug,
          name: _workspace.name,
        })
      );
    }
    getWorkspace();
  }, []);

  return (
    <>
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        {!isMobile && <Sidebar />}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Prompt Library bar — always visible when workspace is loaded */}
          {workspace && (
            <div className="flex items-center gap-x-2 px-4 py-1.5 border-b border-white/10 shrink-0 bg-theme-bg-secondary">
              <BookBookmark
                className="h-4 w-4 text-theme-text-secondary shrink-0"
                weight={activeTemplate ? "fill" : "regular"}
              />
              {activeTemplate ? (
                <>
                  <span className="text-xs text-white font-medium truncate">
                    Prompt Library:{" "}
                    <span className="text-primary-button">
                      {activeTemplate.name}
                    </span>
                  </span>
                  <button
                    onClick={() => setShowDrawer(true)}
                    className="ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded bg-primary-button/20 hover:bg-primary-button/40 text-primary-button"
                  >
                    Change
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-theme-text-secondary">
                    No prompt template selected
                  </span>
                  <button
                    onClick={() => setShowDrawer(true)}
                    className="ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    Select template
                  </button>
                </>
              )}
            </div>
          )}
          <WorkspaceChatContainer loading={loading} workspace={workspace} />
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && workspace && (
        <PromptLibraryDrawer
          workspace={workspace}
          activeTemplate={activeTemplate}
          onSelect={(template) => {
            setActiveTemplate(template);
            setShowDrawer(false);
          }}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </>
  );
}
