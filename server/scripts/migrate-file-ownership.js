/**
 * =============================================================================
 * MIGRÁCIÓS SCRIPT — Fájl-workspace hozzárendelés
 * =============================================================================
 *
 * MIKOR KELL FUTTATNI?
 * --------------------
 * Egyszer, az éles szerver átállításakor, miután a hepa-0316-update-test
 * branch-re váltottál. Az új branch bevezet egy "workspace_manager" szerepkört,
 * amely csak azokat a fájlokat látja az "Available documents" listában, amelyek
 * az ő workspace-éhez tartoznak.
 *
 * Mivel a régi feltöltéseknél nincs rögzítve melyik fájl melyik workspace-hez
 * tartozik, ez a script utólag pótolja ezt az információt a workspace_documents
 * tábla alapján.
 *
 * MIT CSINÁL?
 * -----------
 * 1. Végigmegy az összes workspace-hez rendelt dokumentumon (workspace_documents).
 * 2. Minden dokumentumnál megkeresi a workspace slug-ját (pl. "projekt-alpha").
 * 3. Beírja a fájl hash-ét és workspace slug-ját a file_upload_hashes táblába.
 *    Ha a rekord már létezik (hash egyezés), nem írja felül.
 *
 * EREDMÉNY:
 * ---------
 * A workspace_manager felhasználók csak azokat a fájlokat látják az "Available
 * documents" bal panelben, amelyek az ő workspace-ükhöz tartoznak. Más
 * workspace-ek fájljait nem látják — még akkor sem, ha azok is a szerveren
 * vannak tárolva.
 *
 * BIZTONSÁGOS-E?
 * --------------
 * Igen. A script:
 *   - Nem töröl semmit.
 *   - Nem módosít meglévő rekordokat (csak új rekordokat ír be).
 *   - Többször is futtatható, nem ír duplán.
 *   - A workspace_documents és workspaces táblákat csak olvassa.
 *   - SQLite és PostgreSQL adatbázison egyaránt működik.
 *
 * MI NEM VÁLTOZIK?
 * ----------------
 *   - A fájlok fizikailag megmaradnak (storage/documents/).
 *   - A workspace-dokumentum kapcsolatok megmaradnak (workspace_documents).
 *   - A vektoros embeddings megmaradnak (lancedb/).
 *   - A chat history megmarad.
 *
 * FUTTATÁS ELŐTT:
 * ---------------
 * 1. Győződj meg róla, hogy a branch csere és yarn install megtörtént.
 * 2. Győződj meg róla, hogy a Prisma migrációk lefutottak:
 *      cd server && npx prisma migrate deploy
 *
 * FUTTATÁS:
 * ---------
 *   cd /path/to/anythingllm
 *   node server/scripts/migrate-file-ownership.js
 *
 * KIMENET ÉRTELMEZÉSE:
 * --------------------
 *   [OK]   filename → workspace "projekt-alpha"
 *          → Sikeresen hozzárendelve a workspace-hez.
 *
 *   [SKIP] filename
 *          → A fájl nem található a lemezen (már törölve lett). Nem probléma.
 *
 *   [DUP]  filename
 *          → Már szerepel a táblában (script korábban már futott). Nem probléma.
 *
 * =============================================================================
 */

const prisma = require("../utils/prisma");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const STORAGE_PATH = path.resolve(__dirname, "../storage/documents");

function sha1File(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha1").update(buf).digest("hex");
  } catch {
    return null;
  }
}

async function run() {
  console.log("=============================================================");
  console.log(" Fajl-workspace migracios script inditasa...");
  console.log("=============================================================\n");

  // Lekérjük az összes workspace_documents bejegyzést a workspace slug-jával együtt
  const documents = await prisma.workspace_documents.findMany({
    select: {
      docpath: true,
      filename: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
  });

  console.log(`[+] ${documents.length} dokumentum talalhato a workspace_documents tablaban.\n`);

  let ok = 0;
  let skipped = 0;
  let duplicate = 0;

  for (const doc of documents) {
    const filePath = path.join(STORAGE_PATH, "..", doc.docpath);
    const workspaceSlug = doc.workspace?.slug ?? String(doc.workspaceId);

    const hash = sha1File(filePath);
    if (!hash) {
      console.warn(`  [SKIP] Fajl nem talalhato a lemezen: ${doc.docpath}`);
      skipped++;
      continue;
    }

    // Ellenőrzés: már szerepel-e a táblában
    const existing = await prisma.file_upload_hashes.findUnique({
      where: { hash },
      select: { id: true },
    });

    if (existing) {
      console.log(`  [DUP]  ${doc.filename} -> mar szerepel a tablaban`);
      duplicate++;
      continue;
    }

    await prisma.file_upload_hashes.create({
      data: {
        hash,
        filename: doc.filename,
        workspace_id: workspaceSlug,
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
      },
    });

    console.log(`  [OK]   ${doc.filename} -> workspace "${workspaceSlug}"`);
    ok++;
  }

  console.log("\n=============================================================");
  console.log(` Kesz.`);
  console.log(`   Hozzarendelve:             ${ok} fajl`);
  console.log(`   Mar szerepelt:             ${duplicate} fajl`);
  console.log(`   Kihagyva (nincs lemezen):  ${skipped} fajl`);
  console.log("=============================================================");

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("\n[HIBA] A migracio sikertelen:", e.message);
  process.exit(1);
});
