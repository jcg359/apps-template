from pydantic import BaseModel


class AppDefinition(BaseModel):
    id: str
    name: str
    description: str
    href: str


# Hand-curated for now. Will move to a DB-backed source when the catalog grows
# beyond what's reasonable to maintain here.
CATALOG: list[AppDefinition] = [
    AppDefinition(
        id="access-manager",
        name="Access Manager",
        description="Manage users, roles, and permissions for the platform.",
        href="/apps/access-manager/",
    ),
]


def list_apps() -> list[AppDefinition]:
    return list(CATALOG)
