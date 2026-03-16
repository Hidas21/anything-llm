-- CreateTable: ai_consents
-- AI Beleegyezés modul - tárolja a felhasználók beleegyező nyilatkozatának elfogadását
CREATE TABLE "ai_consents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT 'AI System Usage and Consent Policy',
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ai_consents_userId_idx" ON "ai_consents"("userId");
