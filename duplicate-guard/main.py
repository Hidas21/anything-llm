"""
AnythingLLM Duplicate File Guard
=================================
Standalone FastAPI proxy that intercepts file uploads, deduplicates them via
SHA-1 hashing, and forwards new files to AnythingLLM's original upload endpoint.

Design principles:
  - Zero modifications to AnythingLLM source code
  - Fail-open: if this service is down, uploads reach AnythingLLM directly
  - Single .env file controls all AnythingLLM connection settings
  - Version-locked upload path — change ONE value when AnythingLLM updates
"""

import hashlib
import os
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import uvicorn
from database import Database
from dotenv import load_dotenv
from fastapi import FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─── Config (all AnythingLLM settings in one place) ──────────────────────────

load_dotenv()

ANYTHINGLLM_BASE_URL: str   = os.getenv("ANYTHINGLLM_BASE_URL",   "http://localhost:3001")
ANYTHINGLLM_API_KEY:  str   = os.getenv("ANYTHINGLLM_API_KEY",    "")
# Version-locked — only this line needs updating when AnythingLLM changes its API
ANYTHINGLLM_UPLOAD_PATH: str = os.getenv("ANYTHINGLLM_UPLOAD_PATH", "/api/v1/document/upload")

GUARD_PORT: int  = int(os.getenv("GUARD_PORT", "3002"))
DB_PATH:    str  = os.getenv("DB_PATH",    "./hashes.db")
FAIL_OPEN:  bool = os.getenv("FAIL_OPEN",  "true").lower() == "true"

ANYTHINGLLM_UPLOAD_URL = f"{ANYTHINGLLM_BASE_URL}{ANYTHINGLLM_UPLOAD_PATH}"

# ─── Database ─────────────────────────────────────────────────────────────────

db = Database(DB_PATH)

# ─── App lifecycle ────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    print(f"[Guard] SQLite store: {DB_PATH}")
    print(f"[Guard] Forwarding to: {ANYTHINGLLM_UPLOAD_URL}")
    print(f"[Guard] Fail-open mode: {FAIL_OPEN}")
    yield

app = FastAPI(
    title="AnythingLLM Duplicate File Guard",
    version="1.0.0",
    description="SHA-1 deduplication proxy for AnythingLLM file uploads.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sha1(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()

def _auth_headers(forwarded_auth: Optional[str]) -> dict:
    """Build auth headers: prefer the caller's token, fall back to .env key."""
    if forwarded_auth:
        return {"Authorization": forwarded_auth}
    if ANYTHINGLLM_API_KEY:
        return {"Authorization": f"Bearer {ANYTHINGLLM_API_KEY}"}
    return {}

def _extract_doc_id(response_body: dict) -> Optional[str]:
    """Best-effort: pull the document id from AnythingLLM's upload response."""
    try:
        return (
            response_body.get("document", {}).get("id")
            or response_body.get("documents", [{}])[0].get("id")
        )
    except Exception:
        return None

# ─── Main upload intercept ────────────────────────────────────────────────────

@app.post(
    "/api/v1/document/upload",
    summary="Intercept, deduplicate, and forward file uploads",
    tags=["upload"],
)
async def upload_file(
    file: UploadFile = File(..., description="File to upload"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    x_uploaded_by:  Optional[str] = Header(None, alias="X-Uploaded-By"),
):
    """
    1. Read the uploaded file into memory
    2. Compute SHA-1 hash
    3. If hash exists in store → reject with 409 and details of original upload
    4. If new → forward to AnythingLLM, store hash on success, return response
    """
    content: bytes = await file.read()
    sha1 = _sha1(content)
    filename = file.filename or "unknown"

    # ── Duplicate check ───────────────────────────────────────────────────────
    existing = db.find_by_hash(sha1)
    if existing:
        return JSONResponse(
            status_code=409,
            content={
                "ok": False,
                "duplicate": True,
                "hash": sha1,
                "message": (
                    f"Duplicate file detected. '{filename}' is identical to "
                    f"'{existing['filename']}' uploaded on {existing['uploaded_at']}."
                ),
                "original": {
                    "filename":     existing["filename"],
                    "uploaded_at":  existing["uploaded_at"],
                    "workspace_id": existing["workspace_id"],
                    "uploaded_by":  existing["uploaded_by"],
                },
            },
        )

    # ── Forward to AnythingLLM ────────────────────────────────────────────────
    headers = _auth_headers(authorization)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                ANYTHINGLLM_UPLOAD_URL,
                files={"file": (filename, content, file.content_type or "application/octet-stream")},
                headers=headers,
            )
    except httpx.RequestError as exc:
        if FAIL_OPEN:
            # Service unreachable — tell the client to retry directly
            raise HTTPException(
                status_code=502,
                detail={
                    "ok": False,
                    "failOpen": True,
                    "message": (
                        f"Guard could not reach AnythingLLM ({exc}). "
                        f"Upload directly to {ANYTHINGLLM_UPLOAD_URL} to bypass."
                    ),
                },
            )
        raise HTTPException(502, detail=f"Cannot reach AnythingLLM: {exc}")

    # ── Store hash only on success ────────────────────────────────────────────
    if resp.status_code in (200, 201):
        try:
            body = resp.json()
        except Exception:
            body = {}
        doc_id = _extract_doc_id(body)
        db.store(
            sha1=sha1,
            filename=filename,
            workspace_id=x_workspace_id,
            uploaded_by=x_uploaded_by,
            doc_id=doc_id,
        )
        return JSONResponse(status_code=resp.status_code, content=body)

    # AnythingLLM returned an error — pass it through without storing the hash
    try:
        error_body = resp.json()
    except Exception:
        error_body = {"detail": resp.text}

    return JSONResponse(status_code=resp.status_code, content=error_body)


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@app.get("/guard/hashes", summary="List all stored hashes", tags=["admin"])
def list_hashes(
    limit:  int = Query(50,  ge=1, le=500),
    offset: int = Query(0,   ge=0),
):
    """Paginated list of every file that passed through the guard."""
    return {
        "total":  db.total_count(),
        "limit":  limit,
        "offset": offset,
        "items":  db.all_hashes(limit=limit, offset=offset),
    }


@app.delete(
    "/guard/hashes/{sha1}",
    summary="Remove a hash (allow re-upload of the same file)",
    tags=["admin"],
)
def delete_hash(sha1: str):
    """Delete a stored hash so the file can be re-uploaded."""
    deleted = db.delete_by_hash(sha1)
    if not deleted:
        raise HTTPException(404, detail=f"Hash '{sha1}' not found.")
    return {"ok": True, "deleted": sha1}


@app.get("/guard/check/{sha1}", summary="Check if a hash is known", tags=["admin"])
def check_hash(sha1: str):
    """Quick duplicate check without uploading — useful for client-side pre-check."""
    existing = db.find_by_hash(sha1)
    if existing:
        return {"duplicate": True, "original": existing}
    return {"duplicate": False}


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
def health():
    return {
        "ok": True,
        "service": "duplicate-file-guard",
        "anythingllm": ANYTHINGLLM_UPLOAD_URL,
        "fail_open": FAIL_OPEN,
        "total_hashes": db.total_count(),
    }


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=GUARD_PORT,
        reload=True,
        log_level="info",
    )
