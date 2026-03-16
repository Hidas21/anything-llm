import base64
import secrets

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse

from .allm_client import ALLMClient
from .config import Settings
from .ldap_client import LDAPClient
from .mapping import MappingResolver

settings = Settings()
app = FastAPI(title="AnythingLLM Auth Bridge")

ldap = LDAPClient(settings)
allm = ALLMClient(settings.ALLM_BASE_URL, settings.ALLM_API_KEY)
mapper = MappingResolver(settings.MAPPING_FILE)


@app.get("/health")
async def health():
    return {"status": "ok"}


async def _provision_and_redirect(username: str, groups: list[str]) -> dict:
    workspace_slugs, primary_ws = mapper.resolve(groups)

    existing = await allm.find_user_by_username(username)
    if existing:
        user_id = existing["id"]
    else:
        temp_password = secrets.token_urlsafe(32)
        result = await allm.create_user(username, temp_password, role="default")
        user_id = result["user"]["id"]

    existing_workspaces = await allm.list_workspaces()
    existing_slugs = {ws["slug"] for ws in existing_workspaces}

    for slug in workspace_slugs:
        if slug not in existing_slugs:
            await allm.create_workspace(slug)
        await allm.add_user_to_workspace(slug, user_id)

    token_data = await allm.issue_auth_token(user_id)
    redirect_path = f"/workspaces/{primary_ws}"
    sso_url = (
        f"{settings.ALLM_BASE_URL}{token_data['loginPath']}"
        f"&redirectTo={redirect_path}"
    )
    return {"redirect_url": sso_url, "workspaces": workspace_slugs}


@app.post("/auth/login")
async def login(email: str = Query(...), password: str = Query(...)):
    user_info = ldap.authenticate(email, password)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return await _provision_and_redirect(user_info["username"], user_info["groups"])


@app.get("/auth/magic-link")
async def magic_link_login(token: str = Query(...)):
    try:
        email = base64.urlsafe_b64decode(token + "==").decode()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid magic link")

    groups = ldap.get_user_groups(email)
    username = email.split("@")[0]
    result = await _provision_and_redirect(username, groups)
    return RedirectResponse(url=result["redirect_url"])
