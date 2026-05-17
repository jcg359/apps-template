from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    entra_tenant_id: str = ""
    entra_audience: str = ""
    entra_jwks_url: str | None = None
    skip_auth: bool = False

    @property
    def jwks_url(self) -> str:
        if self.entra_jwks_url:
            return self.entra_jwks_url
        if not self.entra_tenant_id:
            raise RuntimeError("ENTRA_TENANT_ID is required unless ENTRA_JWKS_URL is set")
        return (
            f"https://login.microsoftonline.com/{self.entra_tenant_id}/discovery/v2.0/keys"
        )

    @property
    def issuer(self) -> str:
        return f"https://login.microsoftonline.com/{self.entra_tenant_id}/v2.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
