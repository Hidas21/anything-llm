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
 * 1. Létrehozza a file_upload_hashes táblát, ha még nem létezik.
 * 2. Végigmegy az összes workspace-hez rendelt dokumentumon (workspace_documents).
 * 3. Minden dokumentumnál megkeresi a workspace slug-ját (pl. "projekt-alpha").
 * 4. Beírja a fájl hash-ét és workspace slug-ját a file_upload_hashes táblába.
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
 *   - Nem módosít meglévő rekordokat (INSERT OR IGNORE).
 *   - Többször is futtatható, nem ír duplán.
 *   - A workspace_documents és workspaces táblákat csak olvassa.
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
 * 1. Mentsd le az adatbázist:
 *      cp server/storage/anythingllm.db server/storage/anythingllm.db.backup
 * 2. Győződj meg róla, hogy a branch csere és yarn install megtörtént.
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

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS file_upload_hashes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      hash         TEXT    NOT NULL UNIQUE,
      filename     TEXT    NOT NULL,
      workspace_id TEXT,
      uploaded_by  INTEGER,
      uploaded_at  TEXT    NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_upload_hash ON file_upload_hashes(hash)`
  );
}

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
  console.log(" Fájl-workspace migrációs script indítása...");
  console.log("=============================================================\n");

  await ensureTable();
  console.log("[+] file_upload_hashes tábla OK\n");

  // Lekérjük az összes workspace_documents bejegyzést a workspace slug-jával együtt
  const documents = await prisma.workspace_documents.findMany({
    select: {
      docpath: true,
      filename: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
  });

  console.log(`[+] ${documents.length} dokumentum található a workspace_documents táblában.\n`);

  let ok = 0;
  let skipped = 0;
  let duplicate = 0;

  for (const doc of documents) {
    const filePath = path.join(STORAGE_PATH, "..", doc.docpath);
    const workspaceSlug = doc.workspace?.slug ?? String(doc.workspaceId);

    const hash = sha1File(filePath);
    if (!hash) {
      console.warn(`  [SKIP] Fájl nem található a lemezen: ${doc.docpath}`);
      skipped++;
      continue;
    }

    // Ellenőrzés: már szerepel-e a táblában
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM file_upload_hashes WHERE hash = ? LIMIT 1`,
      hash
    );
    if (existing.length > 0) {
      console.log(`  [DUP]  ${doc.filename} → már szerepel a táblában`);
      duplicate++;
      continue;
    }

    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO file_upload_hashes
         (hash, filename, workspace_id, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, NULL, ?)`,
      hash,
      doc.filename,
      workspaceSlug,
      new Date().toISOString()
    );

    console.log(`  [OK]   ${doc.filename} → workspace "${workspaceSlug}"`);
    ok++;
  }

  console.log("\n=============================================================");
  console.log(` Kész.`);
  console.log(`   Hozzárendelve:    ${ok} fájl`);
  console.log(`   Már szerepelt:    ${duplicate} fájl`);
  console.log(`   Kihagyva (nincs lemezen): ${skipped} fájl`);
  console.log("=============================================================");

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("\n[HIBA] A migráció sikertelen:", e.message);
  process.exit(1);
});
