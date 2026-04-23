import { ArrowsDownUp } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Workspace from "../../../../models/workspace";
import System from "../../../../models/system";
import showToast from "../../../../utils/toast";
import Directory from "./Directory";
import WorkspaceDirectory from "./WorkspaceDirectory";
import { useWorkspaceEmbeddingProgress } from "@/EmbeddingProgressContext";

// OpenAI Cost per token
const MODEL_COSTS = {
  "text-embedding-ada-002": 0.0000001,
  "text-embedding-3-small": 0.00000002,
  "text-embedding-3-large": 0.00000013,
};

export default function DocumentSettings({ workspace, systemSettings, user }) {
  const [highlightWorkspace, setHighlightWorkspace] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceDocs, setWorkspaceDocs] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [movedItems, setMovedItems] = useState([]);
  const [embeddingsCost, setEmbeddingsCost] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const availableDocsRef = useRef([]);

  useEffect(() => {
    availableDocsRef.current = availableDocs;
  }, [availableDocs]);

  const fetchKeysRef = useRef(null);
  const { embeddingProgress, startEmbedding } = useWorkspaceEmbeddingProgress(
    workspace.slug,
    {
      onProgressCleared: () => fetchKeysRef.current?.(true),
    }
  );

  async function fetchKeys(refetchWorkspace = false, options = {}) {
    const { autoSelectNew = false } = options;
    const previousIds = new Set();
    if (autoSelectNew && availableDocsRef.current?.items) {
      for (const folder of availableDocsRef.current.items) {
        for (const file of folder.items ?? []) {
          if (file?.id) previousIds.add(file.id);
        }
      }
    }
    setLoading(true);
    const localFiles = await System.localFiles();
    const currentWorkspace = refetchWorkspace
      ? await Workspace.bySlug(workspace.slug)
      : workspace;

    const documentsInWorkspace =
      currentWorkspace?.documents?.map((doc) => doc.docpath) || [];

    const isWorkspaceManager = user?.role === "workspace_manager";

    // Documents that are not in the workspace
    const filteredAvailableDocs = {
      ...localFiles,
      items: (localFiles?.items ?? []).map((folder) => {
        if (folder.items && folder.type === "folder") {
          return {
            ...folder,
            items: folder.items.filter(
              (file) =>
                file.type === "file" &&
                !documentsInWorkspace.includes(`${folder.name}/${file.name}`) &&
                (!isWorkspaceManager || file.uploadedBy == user?.id)
            ),
          };
        } else {
          return folder;
        }
      }),
    };

    // Documents that are already in the workspace
    const filteredWorkspaceDocs = {
      ...localFiles,
      items: (localFiles?.items ?? []).map((folder) => {
        if (folder.items && folder.type === "folder") {
          return {
            ...folder,
            items: folder.items.filter(
              (file) =>
                file.type === "file" &&
                documentsInWorkspace.includes(`${folder.name}/${file.name}`)
            ),
          };
        } else {
          return folder;
        }
      }),
    };

    setAvailableDocs(filteredAvailableDocs);
    setWorkspaceDocs(filteredWorkspaceDocs);

    if (autoSelectNew) {
      const newSelected = {};
      for (const folder of filteredAvailableDocs.items ?? []) {
        for (const file of folder.items ?? []) {
          if (file?.id && !previousIds.has(file.id)) {
            newSelected[file.id] = true;
          }
        }
      }
      if (Object.keys(newSelected).length > 0) {
        setSelectedItems((prev) => ({ ...prev, ...newSelected }));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchKeysRef.current = fetchKeys;
  });

  useEffect(() => {
    fetchKeys(true);
  }, []);

  const updateWorkspace = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("This may take a while for large documents");

    const filenames = movedItems.map(
      (item) => `${item.folderName}/${item.name}`
    );
    const changesToSend = { adds: filenames };

    setSelectedItems({});
    setHasChanges(false);
    setHighlightWorkspace(false);

    const embedPromise = Workspace.modifyEmbeddings(
      workspace.slug,
      changesToSend
    );
    startEmbedding(workspace.slug, filenames);

    embedPromise.catch((error) => {
      showToast(`Workspace update failed: ${error}`, "error", {
        clear: true,
      });
    });

    setLoading(false);
    setLoadingMessage("");
    setMovedItems([]);
  };

  const removeItemFromMoved = (itemId) => {
    const itemToReturn = movedItems.find((i) => i.id === itemId);
    if (!itemToReturn) return;

    let newAvailableDocs = JSON.parse(JSON.stringify(availableDocs));
    let newWorkspaceDocs = JSON.parse(JSON.stringify(workspaceDocs));

    const folderIndex = newAvailableDocs.items.findIndex(
      (f) => f.name === itemToReturn.folderName
    );
    if (folderIndex !== -1) {
      newAvailableDocs.items[folderIndex].items.push(itemToReturn);
    }

    newWorkspaceDocs.items = newWorkspaceDocs.items.map((folder) => ({
      ...folder,
      items: folder.items.filter((f) => f.id !== itemId),
    }));

    const newMovedItems = movedItems.filter((i) => i.id !== itemId);
    setMovedItems(newMovedItems);
    setAvailableDocs(newAvailableDocs);
    setWorkspaceDocs(newWorkspaceDocs);
    if (newMovedItems.length === 0) setHasChanges(false);
  };

  const moveSelectedItemsToWorkspace = () => {
    setHighlightWorkspace(false);
    setHasChanges(true);

    const newMovedItems = [];

    for (const itemId of Object.keys(selectedItems)) {
      for (const folder of availableDocs.items) {
        const foundItem = folder.items.find((file) => file.id === itemId);
        if (foundItem) {
          newMovedItems.push({ ...foundItem, folderName: folder.name });
          break;
        }
      }
    }

    let totalTokenCount = 0;
    newMovedItems.forEach((item) => {
      const { cached, token_count_estimate } = item;
      if (!cached) totalTokenCount += token_count_estimate;
    });

    if (systemSettings?.EmbeddingEngine === "openai") {
      const COST_PER_TOKEN =
        MODEL_COSTS[systemSettings?.EmbeddingModelPref || "text-embedding-ada-002"];
      setEmbeddingsCost((totalTokenCount / 1000) * COST_PER_TOKEN);
    }

    setMovedItems([...movedItems, ...newMovedItems]);

    let newAvailableDocs = JSON.parse(JSON.stringify(availableDocs));
    let newWorkspaceDocs = JSON.parse(JSON.stringify(workspaceDocs));

    for (const itemId of Object.keys(selectedItems)) {
      let foundItem = null;
      let foundFolderIndex = null;

      newAvailableDocs.items = newAvailableDocs.items.map(
        (folder, folderIndex) => {
          const remainingItems = folder.items.filter((file) => {
            const match = file.id === itemId;
            if (match) {
              foundItem = { ...file };
              foundFolderIndex = folderIndex;
            }
            return !match;
          });
          return { ...folder, items: remainingItems };
        }
      );

      if (foundItem) {
        newWorkspaceDocs.items[foundFolderIndex].items.push(foundItem);
      }
    }

    setAvailableDocs(newAvailableDocs);
    setWorkspaceDocs(newWorkspaceDocs);
    setSelectedItems({});
  };

  const visibleAvailableDocs = useMemo(() => {
    const embeddingFilenames = new Set(Object.keys(embeddingProgress ?? {}));
    if (embeddingFilenames.size === 0) return availableDocs;
    return {
      ...availableDocs,
      items: (availableDocs.items ?? []).map((folder) => {
        if (folder.items && folder.type === "folder") {
          return {
            ...folder,
            items: folder.items.filter(
              (file) => !embeddingFilenames.has(`${folder.name}/${file.name}`)
            ),
          };
        }
        return folder;
      }),
    };
  }, [availableDocs, embeddingProgress]);

  return (
    <div className="flex upload-modal -mt-6 z-10 relative">
      <Directory
        files={visibleAvailableDocs}
        setFiles={setAvailableDocs}
        loading={loading}
        loadingMessage={loadingMessage}
        setLoading={setLoading}
        workspace={workspace}
        fetchKeys={fetchKeys}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        updateWorkspace={updateWorkspace}
        highlightWorkspace={highlightWorkspace}
        setHighlightWorkspace={setHighlightWorkspace}
        moveToWorkspace={moveSelectedItemsToWorkspace}
        setLoadingMessage={setLoadingMessage}
      />
      <div className="upload-modal-arrow">
        <ArrowsDownUp className="text-white text-base font-bold rotate-90 w-11 h-11" />
      </div>
      <WorkspaceDirectory
        workspace={workspace}
        files={workspaceDocs}
        highlightWorkspace={highlightWorkspace}
        loading={loading}
        loadingMessage={loadingMessage}
        setLoadingMessage={setLoadingMessage}
        setLoading={setLoading}
        fetchKeys={fetchKeys}
        hasChanges={hasChanges}
        saveChanges={updateWorkspace}
        embeddingCosts={embeddingsCost}
        movedItems={movedItems}
        removeItemFromMoved={removeItemFromMoved}
      />
    </div>
  );
}
