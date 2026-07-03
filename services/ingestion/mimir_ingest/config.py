"""Runtime configuration, loaded from environment (.env)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get("DATABASE_URL", "")
    fec_api_key: str = os.environ.get("FEC_API_KEY", "")
    congress_api_key: str = os.environ.get("CONGRESS_GOV_API_KEY", "")
    census_api_key: str = os.environ.get("CENSUS_API_KEY", "")
    x_bearer_token: str = os.environ.get("X_API_BEARER_TOKEN", "")
    anthropic_api_key: str = os.environ.get("ANTHROPIC_API_KEY", "")
    classifier_model: str = os.environ.get("CLASSIFIER_MODEL", "claude-sonnet-5")
    user_agent: str = os.environ.get(
        "INGEST_USER_AGENT", "MimirCivicBot/0.1 (+contact@example.org)"
    )
    cycle: int = int(os.environ.get("INGEST_ELECTION_CYCLE", "2026"))


settings = Settings()
