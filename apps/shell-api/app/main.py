from typing import Any

from fastapi import FastAPI

from .apps_catalog import AppDefinition, list_apps
from .auth import Claims

app = FastAPI(title="apps-platform shell-api", version="0.0.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/whoami")
def whoami(claims: Claims) -> dict[str, Any]:
    return {
        "user": {
            "email": claims.get("preferred_username") or claims.get("email") or claims.get("upn"),
            "name": claims.get("name"),
            "sub": claims.get("sub"),
        },
        "groups": claims.get("groups", []),
    }


@app.get("/api/apps")
def apps(_: Claims) -> dict[str, list[AppDefinition]]:
    return {"apps": list_apps()}
