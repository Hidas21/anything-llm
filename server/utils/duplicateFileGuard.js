/**
 * Duplicate File Guard — isolated middleware
 * Runs AFTER multer saves the file to collector/hotdir, BEFORE the handler.
 *
 * Flow:
 *   1. Read the file multer just saved to disk
 *   2. Compute SHA-1
 *   3. If hash known → delete temp file, return 409
 *   4. If new → store hash, call next()
 *
 * Hash store: SQLite at server/storage/file_hashes.db (auto-created)
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../utils/prisma");

// ─── Schema init (runs once on first import) ──────────────────────────────────

let _ready = false;
async function ensureTable() {
  if (_ready) return;
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
  _ready = true;
}

ensureTable().catch((e) =>
  console.error("[DuplicateFileGuard] DB init error:", e.message)
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha1File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(buf).digest("hex");
}

async function findHash(hash) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM file_upload_hashes WHERE hash = ? LIMIT 1`,
    hash
  );
  return rows[0] ?? null;
}

async function storeHash(hash, filename, workspaceId, userId) {
  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO file_upload_hashes
       (hash, filename, workspace_id, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, ?, ?)`,
    hash,
    filename,
    workspaceId ?? null,
    userId ?? null,
    now
  );
}

// ─── Express middleware ───────────────────────────────────────────────────────

/**
 * Drop this into a route's middleware array AFTER handleFileUpload:
 *   [validatedRequest, flexUserRoleValid([...]), handleFileUpload, duplicateFileGuard]
 */
async function duplicateFileGuard(request, response, next) {
  // If multer found no file, skip (some routes are optional)
  if (!request.file) return next();

  const filePath = request.file.path;
  const filename = request.file.originalname;
  const workspaceId = request.params?.slug ?? null;
  const userId = response.locals?.user?.id ?? null;

  try {
    await ensureTable();
    const hash = sha1File(filePath);
    const existing = await findHash(hash);

    if (existing) {
      // Delete the temp file so collector/hotdir stays clean
      try { fs.unlinkSync(filePath); } catch (_) {}

      return response.status(409).json({
        success: false,
        duplicate: true,
        error: `Duplicate file: "${filename}" is identical to "${existing.filename}" uploaded on ${existing.uploaded_at}.`,
        original: {
          filename:    existing.filename,
          uploadedAt:  existing.uploaded_at,
          workspaceId: existing.workspace_id,
        },
      });
    }

    // New file — store hash and let the request continue
    await storeHash(hash, filename, workspaceId, userId);
    next();
  } catch (e) {
    // Fail-open: if the guard errors, let the upload through
    console.error("[DuplicateFileGuard] Error (fail-open):", e.message);
    next();
  }
}

module.exports = { duplicateFileGuard };
