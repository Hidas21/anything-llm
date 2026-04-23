/**
 * Access control integration tests
 *
 * Tesztelt edge case-ek:
 *   1. default user nem látja más user "My Workspace"-ét
 *   2. workspace_manager nem látja azokat a workspace-eket amihez nincs rendelve
 *   3. workspace_manager nem tölthet fel fájlt idegen workspace-be
 *   4. default user nem tölthet fel fájlt semmilyen workspace-be
 *   5. chat endpoint nem válaszol idegen workspace slugra (nincs hozzáférés)
 *
 * Futtatás (szerver legyen elindítva: yarn dev):
 *   node tests/access-control.test.js
 *
 * Környezeti változók (opcionális, default értékek a lokális devhez):
 *   BASE_URL   – pl. http://localhost:3001  (default)
 *   ADMIN_USER – admin felhasználónév       (default: admin)
 *   ADMIN_PASS – admin jelszó               (default: admin123)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// ─── helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? `  →  ${detail}` : ""}`);
    failed++;
  }
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function login(username, password) {
  const { status, json } = await api("/api/request-token", {
    method: "POST",
    body: { username, password },
  });
  if (status !== 200 || !json?.token) throw new Error(`Login failed for ${username}: ${status}`);
  return json.token;
}

async function createUser(adminToken, { username, password, role }) {
  const { json } = await api("/api/admin/users/new", {
    method: "POST",
    token: adminToken,
    body: { username, password, role },
  });
  if (!json?.user) throw new Error(`Could not create user ${username}: ${JSON.stringify(json)}`);
  return json.user;
}

async function deleteUser(adminToken, userId) {
  await api(`/api/admin/users/${userId}`, { method: "DELETE", token: adminToken });
}

async function createWorkspace(adminToken, name) {
  const { json } = await api("/api/workspace/new", {
    method: "POST",
    token: adminToken,
    body: { name },
  });
  if (!json?.workspace) throw new Error(`Could not create workspace ${name}: ${JSON.stringify(json)}`);
  return json.workspace;
}

async function deleteWorkspace(adminToken, slug) {
  await api(`/api/workspace/${slug}`, { method: "DELETE", token: adminToken });
}

async function assignUserToWorkspace(adminToken, workspaceId, userId) {
  await api(`/api/admin/workspaces/${workspaceId}/update-users`, {
    method: "POST",
    token: adminToken,
    body: { userIds: [userId] },
  });
}

// ─── setup ───────────────────────────────────────────────────────────────────

async function setup() {
  const adminToken = await login(ADMIN_USER, ADMIN_PASS);

  // Egyedi prefix hogy ne ütközzön meglévő adatokkal
  const ts = Date.now();

  // Két sima default user
  const userA = await createUser(adminToken, {
    username: `test_usera_${ts}`,
    password: "Test1234!",
    role: "default",
  });
  const userB = await createUser(adminToken, {
    username: `test_userb_${ts}`,
    password: "Test1234!",
    role: "default",
  });

  // Egy workspace_manager user
  const wsMgr = await createUser(adminToken, {
    username: `test_wsmgr_${ts}`,
    password: "Test1234!",
    role: "workspace_manager",
  });

  // Egy "idegen" workspace amit senkihez sem rendelünk
  const foreignWs = await createWorkspace(adminToken, `foreign_ws_${ts}`);

  // wsMgr-hez rendelt workspace
  const mgrWs = await createWorkspace(adminToken, `mgr_ws_${ts}`);
  await assignUserToWorkspace(adminToken, mgrWs.id, wsMgr.id);

  // userA My Workspace-ét az auto-create hozta létre – megkeressük
  const { json: allWs } = await api("/api/workspaces", { token: adminToken });
  const userAMyWs = (allWs?.workspaces ?? []).find(
    (w) => w.name === "My Workspace" && w.slug.includes(String(userA.id))
  ) ?? (allWs?.workspaces ?? []).find((w) => w.name === "My Workspace");

  return {
    adminToken,
    userA, userB, wsMgr,
    foreignWs, mgrWs, userAMyWs,
    cleanup: async () => {
      await deleteWorkspace(adminToken, foreignWs.slug);
      await deleteWorkspace(adminToken, mgrWs.slug);
      await deleteUser(adminToken, userA.id);
      await deleteUser(adminToken, userB.id);
      await deleteUser(adminToken, wsMgr.id);
    },
  };
}

// ─── test suites ─────────────────────────────────────────────────────────────

async function testWorkspaceVisibility(ctx) {
  console.log("\n── Suite 1: Workspace láthatóság ──────────────────────────────");

  const tokenA = await login(`test_usera_${ctx.ts}`, "Test1234!");
  const tokenB = await login(`test_userb_${ctx.ts}`, "Test1234!");
  const tokenMgr = await login(`test_wsmgr_${ctx.ts}`, "Test1234!");

  // 1a. userB nem látja userA My Workspace-ét
  const { json: wsListB } = await api("/api/workspaces", { token: tokenB });
  const slugsB = (wsListB?.workspaces ?? []).map((w) => w.slug);
  const userAWsSlug = ctx.userAMyWs?.slug;
  assert(
    "userB nem látja userA My Workspace-ét a /workspaces listában",
    userAWsSlug ? !slugsB.includes(userAWsSlug) : true,
    `slugsB=${JSON.stringify(slugsB)}, userASlug=${userAWsSlug}`
  );

  // 1b. userB közvetlen GET kérés userA workspace slugjára → 400/403/404
  if (userAWsSlug) {
    const { status } = await api(`/api/workspace/${userAWsSlug}`, { token: tokenB });
    assert(
      "userB közvetlen hozzáférés userA workspace-éhez → nem 200",
      status !== 200,
      `status=${status}`
    );
  }

  // 1c. workspace_manager nem látja a foreignWs-t (nincs hozzárendelve)
  const { json: wsListMgr } = await api("/api/workspaces", { token: tokenMgr });
  const slugsMgr = (wsListMgr?.workspaces ?? []).map((w) => w.slug);
  assert(
    "workspace_manager nem látja az idegen workspace-t a listában",
    !slugsMgr.includes(ctx.foreignWs.slug),
    `slugsMgr=${JSON.stringify(slugsMgr)}`
  );

  // 1d. workspace_manager látja a saját (hozzárendelt) workspace-ét
  assert(
    "workspace_manager látja a saját hozzárendelt workspace-ét",
    slugsMgr.includes(ctx.mgrWs.slug),
    `slugsMgr=${JSON.stringify(slugsMgr)}`
  );
}

async function testUploadAccess(ctx) {
  console.log("\n── Suite 2: Fájlfeltöltés jogosultság ────────────────────────");

  const tokenA = await login(`test_usera_${ctx.ts}`, "Test1234!");
  const tokenMgr = await login(`test_wsmgr_${ctx.ts}`, "Test1234!");

  // 2a. default user nem tölthet fel semmilyen workspace-be → 401
  const { status: uploadDefault } = await api(
    `/api/workspace/${ctx.mgrWs.slug}/upload`,
    { method: "POST", token: tokenA }
  );
  assert(
    "default user upload kísérlete → 401",
    uploadDefault === 401,
    `status=${uploadDefault}`
  );

  // 2b. workspace_manager nem tölthet fel idegen workspace-be → 400/401
  const { status: uploadForeign } = await api(
    `/api/workspace/${ctx.foreignWs.slug}/upload`,
    { method: "POST", token: tokenMgr }
  );
  assert(
    "workspace_manager idegen workspace-be való upload → nem 200",
    uploadForeign !== 200,
    `status=${uploadForeign}`
  );

  // 2c. default user link feltöltés is tiltott → 401
  const { status: linkDefault } = await api(
    `/api/workspace/${ctx.mgrWs.slug}/upload-link`,
    { method: "POST", token: tokenA, body: { link: "https://example.com" } }
  );
  assert(
    "default user upload-link kísérlete → 401",
    linkDefault === 401,
    `status=${linkDefault}`
  );

  // 2d. workspace_manager idegen workspace-be link feltöltés → nem 200
  const { status: linkForeign } = await api(
    `/api/workspace/${ctx.foreignWs.slug}/upload-link`,
    { method: "POST", token: tokenMgr, body: { link: "https://example.com" } }
  );
  assert(
    "workspace_manager idegen workspace-be upload-link → nem 200",
    linkForeign !== 200,
    `status=${linkForeign}`
  );
}

async function testChatIsolation(ctx) {
  console.log("\n── Suite 3: Chat izoláció (idegen workspace) ─────────────────");

  const tokenA = await login(`test_usera_${ctx.ts}`, "Test1234!");
  const tokenMgr = await login(`test_wsmgr_${ctx.ts}`, "Test1234!");

  // 3a. default user chat küldése workspace-re amihez nincs rendelve → nem 200
  const { status: chatDefault } = await api(
    `/api/workspace/${ctx.foreignWs.slug}/chat`,
    {
      method: "POST",
      token: tokenA,
      body: { message: "hello", mode: "chat" },
    }
  );
  assert(
    "default user chat idegen workspace-ben → nem 200",
    chatDefault !== 200,
    `status=${chatDefault}`
  );

  // 3b. workspace_manager chat idegen workspace-ben → nem 200
  const { status: chatMgr } = await api(
    `/api/workspace/${ctx.foreignWs.slug}/chat`,
    {
      method: "POST",
      token: tokenMgr,
      body: { message: "hello", mode: "chat" },
    }
  );
  assert(
    "workspace_manager chat idegen workspace-ben → nem 200",
    chatMgr !== 200,
    `status=${chatMgr}`
  );

  // 3c. workspace_manager chat a saját workspace-ében → NEM 401/403
  const { status: chatOwn } = await api(
    `/api/workspace/${ctx.mgrWs.slug}/chat`,
    {
      method: "POST",
      token: tokenMgr,
      body: { message: "hello", mode: "chat" },
    }
  );
  assert(
    "workspace_manager chat saját workspace-ében → nem 401/403",
    chatOwn !== 401 && chatOwn !== 403,
    `status=${chatOwn}`
  );
}

async function testEmbeddingAccess(ctx) {
  console.log("\n── Suite 4: Embedding módosítás jogosultság ──────────────────");

  const tokenA = await login(`test_usera_${ctx.ts}`, "Test1234!");
  const tokenMgr = await login(`test_wsmgr_${ctx.ts}`, "Test1234!");

  // 4a. default user nem módosíthatja az embeddingeket → 401
  const { status: embedDefault } = await api(
    `/api/workspace/${ctx.mgrWs.slug}/update-embeddings`,
    { method: "POST", token: tokenA, body: { adds: [], deletes: [] } }
  );
  assert(
    "default user update-embeddings → 401",
    embedDefault === 401,
    `status=${embedDefault}`
  );

  // 4b. workspace_manager idegen workspace embeddingét nem módosíthatja → nem 200
  const { status: embedForeign } = await api(
    `/api/workspace/${ctx.foreignWs.slug}/update-embeddings`,
    { method: "POST", token: tokenMgr, body: { adds: [], deletes: [] } }
  );
  assert(
    "workspace_manager idegen workspace update-embeddings → nem 200",
    embedForeign !== 200,
    `status=${embedForeign}`
  );
}

async function testMyWorkspaceAutoCreate(ctx) {
  console.log("\n── Suite 5: My Workspace auto-létrehozás ─────────────────────");

  // Az admin token-nel lekérdezzük az összes workspace-t
  const { json } = await api("/api/workspaces", { token: ctx.adminToken });
  const allSlugs = (json?.workspaces ?? []).map((w) => w.slug);

  // userA-nak létre kellett jönnie egy My Workspace-nek (auto-create a user létrehozásakor)
  assert(
    "userA-hoz létrejött My Workspace a regisztrációkor",
    ctx.userAMyWs != null,
    "My Workspace nem található az admin listában userA számára"
  );

  // userB-nek is kell lennie egy My Workspace-nek (külön a userA-étól)
  // Ez csak akkor ellenőrizhető ha a slug tartalmaz user-specifikus részt
  // vagy ha admin látja mindkettőt
  const myWsCount = (json?.workspaces ?? []).filter((w) => w.name === "My Workspace").length;
  assert(
    "Legalább 2 'My Workspace' létezik (userA és userB kapott egyet-egyet)",
    myWsCount >= 2,
    `My Workspace count=${myWsCount}`
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Access Control Integration Tests ===");
  console.log(`Target: ${BASE_URL}\n`);

  let ctx;
  try {
    console.log("[ setup ] Felhasználók és workspace-ek létrehozása...");
    const raw = await setup();
    const match = raw.userA.username.match(/_(\d+)$/);
    ctx = { ...raw, ts: match ? match[1] : String(Date.now()) };
    console.log("[ setup ] Kész.\n");
  } catch (e) {
    console.error("[ setup ] HIBA:", e.message);
    console.error("  → Győződj meg róla hogy a szerver fut és az admin jelszó helyes.");
    console.error("  → Állítsd be: ADMIN_USER=... ADMIN_PASS=... node tests/access-control.test.js");
    process.exit(1);
  }

  try {
    await testWorkspaceVisibility(ctx);
    await testUploadAccess(ctx);
    await testChatIsolation(ctx);
    await testEmbeddingAccess(ctx);
    await testMyWorkspaceAutoCreate(ctx);
  } finally {
    console.log("\n[ cleanup ] Tesztadatok törlése...");
    await ctx.cleanup().catch((e) => console.warn("  cleanup hiba:", e.message));
    console.log("[ cleanup ] Kész.");
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Eredmény: ${passed} passed, ${failed} failed`);
  console.log("─".repeat(50));

  if (failed > 0) process.exit(1);
})();
