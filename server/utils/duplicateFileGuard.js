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
 * Uses Prisma client — works with both SQLite and PostgreSQL.
 */

const crypto = require("crypto");
const fs = require("fs");
const prisma = require("../utils/prisma");

function sha1File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(buf).digest("hex");
}

async function findHash(hash) {
  return prisma.file_upload_hashes.findUnique({ where: { hash } });
}

async function storeHash(hash, filename, workspaceId, userId) {
  await prisma.file_upload_hashes.create({
    data: {
      hash,
      filename,
      workspace_id: workspaceId ?? null,
      uploaded_by: userId ?? null,
      uploaded_at: new Date().toISOString(),
    },
  });
}

/**
 * Drop this into a route's middleware array AFTER handleFileUpload:
 *   [validatedRequest, flexUserRoleValid([...]), handleFileUpload, duplicateFileGuard]
 */
async function duplicateFileGuard(request, response, next) {
  if (!request.file) return next();

  const filePath = request.file.path;
  const filename = request.file.originalname;
  const workspaceId = request.params?.slug ?? null;
  const userId = response.locals?.user?.id ?? null;

  try {
    const hash = sha1File(filePath);
    const existing = await findHash(hash);

    if (existing) {
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

    await storeHash(hash, filename, workspaceId, userId);
    next();
  } catch (e) {
    // Fail-open: if the guard errors, let the upload through
    console.error("[DuplicateFileGuard] Error (fail-open):", e.message);
    next();
  }
}

module.exports = { duplicateFileGuard };
