import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LLM Agent Security Firewall & Red-Teaming Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./firewall.db"

    # Security & Cryptography
    SECRET_KEY: str = "rvs-ai-agent-firewall-secure-key-2026"
    HASH_CHAIN_SALT: str = "genesis-block-ai-firewall-audit-seed"

    # Firewall Thresholds
    PROMPT_INJECTION_THRESHOLD: float = 0.65
    DLP_SEVERITY_THRESHOLD: str = "MEDIUM"
    MAX_PROMPT_LENGTH: int = 16000
    SANDBOX_TIMEOUT_SECONDS: int = 15

    # Directory Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    POLICIES_DIR: Path = BASE_DIR / "policies"
    ATTACK_CASES_DIR: Path = BASE_DIR / "redteam" / "attack_cases"
    SANDBOX_DATA_DIR: Path = BASE_DIR / "sandbox_data"

    # Active Policy
    ACTIVE_POLICY_NAME: str = "default"

    # CORS
    CORS_ORIGINS: List[str] = ["*"]


settings = Settings()

# Ensure sandbox data directory exists
settings.SANDBOX_DATA_DIR.mkdir(parents=True, exist_ok=True)
