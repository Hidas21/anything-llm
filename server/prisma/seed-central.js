/**
 * Central Mediacsoport prompt library seeder
 * Csak a Central sablonokat tölti be – HEPA-t nem érinti.
 *
 * Futtatás:
 *   node server/prisma/seed-central.js
 *   -- vagy workspace ID-val: --
 *   CENTRAL_WORKSPACE_ID=3 node server/prisma/seed-central.js
 */

const prisma = require("../utils/prisma");
const {
  seedCentralPromptLibrariesV2,
  CENTRAL_JOURNALIST_SYSTEM_PROMPT,
} = require("../utils/promptLibraryV2/centralLibraries");

async function main() {
  // Ha meg van adva a workspace ID környezeti változóként, ahhoz rendeli a sablonokat
  const workspaceId = process.env.CENTRAL_WORKSPACE_ID
    ? [Number(process.env.CENTRAL_WORKSPACE_ID)]
    : [];

  console.log("Central Mediacsoport prompt sablonok betöltése...");
  const libraries = await seedCentralPromptLibrariesV2({ workspaceIds: workspaceId });
  console.log(`✓ ${libraries.length} sablon sikeresen betöltve.`);

  if (workspaceId.length > 0) {
    console.log(`✓ Hozzárendelve a workspace ID=${workspaceId[0]} workspace-hez.`);

    // Opcionálisan beállítja a system promptot is a workspace-en
    if (process.env.SET_SYSTEM_PROMPT === "true") {
      await prisma.workspaces.updateMany({
        where: { id: Number(workspaceId[0]) },
        data: { openAiPrompt: CENTRAL_JOURNALIST_SYSTEM_PROMPT },
      });
      console.log("✓ System prompt beállítva a workspace-en.");
    }
  }

  console.log("\nSystem prompt szövege (workspace beállításokban illeszd be):");
  console.log("---");
  console.log(CENTRAL_JOURNALIST_SYSTEM_PROMPT);
  console.log("---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
