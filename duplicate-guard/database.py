"""
Persistent hash store — SQLite.
Tracks every file that successfully passed through to AnythingLLM.
"""

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class Database:
    def __init__(self, db_path: str = "./hashes.db"):
        self.db_path = db_path
        self._local = threading.local()

    # ── Connection management (one connection per thread) ─────────────────────

    @property
    def _conn(self) -> sqlite3.Connection:
        if not getattr(self._local, "conn", None):
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")  # safe for concurrent reads
            self._local.conn = conn
        return self._local.conn

    # ── Schema ────────────────────────────────────────────────────────────────

    def init(self) -> None:
        """Create table if it does not exist."""
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS file_hashes (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                hash         TEXT    NOT NULL UNIQUE,
                filename     TEXT    NOT NULL,
                workspace_id TEXT,
                uploaded_by  TEXT,
                uploaded_at  TEXT    NOT NULL,
                anythingllm_doc_id TEXT
            )
        """)
        self._conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_hash ON file_hashes(hash)"
        )
        self._conn.commit()

    # ── Queries ───────────────────────────────────────────────────────────────

    def find_by_hash(self, sha1: str) -> Optional[dict]:
        """Return stored metadata for a hash, or None if not found."""
        row = self._conn.execute(
            "SELECT * FROM file_hashes WHERE hash = ? LIMIT 1", (sha1,)
        ).fetchone()
        return dict(row) if row else None

    def store(
        self,
        sha1: str,
        filename: str,
        workspace_id: Optional[str] = None,
        uploaded_by: Optional[str] = None,
        doc_id: Optional[str] = None,
    ) -> None:
        """Persist a new hash record after a successful forward."""
        now = datetime.now(timezone.utc).isoformat()
        self._conn.execute(
            """
            INSERT OR IGNORE INTO file_hashes
                (hash, filename, workspace_id, uploaded_by, uploaded_at, anythingllm_doc_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (sha1, filename, workspace_id, uploaded_by, now, doc_id),
        )
        self._conn.commit()

    def all_hashes(self, limit: int = 200, offset: int = 0) -> list[dict]:
        """Return paginated list of all stored hashes (for the admin UI)."""
        rows = self._conn.execute(
            "SELECT * FROM file_hashes ORDER BY uploaded_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]

    def total_count(self) -> int:
        return self._conn.execute(
            "SELECT COUNT(*) FROM file_hashes"
        ).fetchone()[0]

    def delete_by_hash(self, sha1: str) -> bool:
        """Remove a hash record (allows re-uploading the same file)."""
        cur = self._conn.execute(
            "DELETE FROM file_hashes WHERE hash = ?", (sha1,)
        )
        self._conn.commit()
        return cur.rowcount > 0
