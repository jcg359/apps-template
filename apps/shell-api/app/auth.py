from typing import Annotated, Any

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient

from .settings import Settings, get_settings


def _jwks_client(settings: Settings) -> PyJWKClient:
    # PyJWKClient caches keys internally; one instance per process is fine.
    if not hasattr(_jwks_client, "_cache"):
        _jwks_client._cache = {}  # type: ignore[attr-defined]
    cache = _jwks_client._cache  # type: ignore[attr-defined]
    url = settings.jwks_url
    client = cache.get(url)
    if client is None:
        client = PyJWKClient(url)
        cache[url] = client
    return client


def verify_bearer(
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    if settings.skip_auth:
        return {"sub": "dev", "name": "Dev User", "email": "dev@example.com"}

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )

    token = authorization[7:]
    try:
        signing_key = _jwks_client(settings).get_signing_key_from_jwt(token).key
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.entra_audience,
            issuer=settings.issuer,
        )
        return claims
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc


Claims = Annotated[dict[str, Any], Depends(verify_bearer)]
