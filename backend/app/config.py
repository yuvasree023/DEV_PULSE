import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    APP_NAME: str = "AI Impact & Developer Productivity Dashboard API"
    ENVIRONMENT: str = "production" if os.getenv("RENDER") else "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database Configuration (PostgreSQL 16 via Supabase, Railway, Render, or local SQLite)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/devpulse"

    # GitHub OAuth & Token Configuration
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = ""

    # Security & User Sessions
    JWT_SECRET: str = "devpulse-super-jwt-secret-key-render-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_SECRET_KEY: str = "devpulse-super-secret-render-key-2026"
    FRONTEND_URL: str = "https://devpulse-app.vercel.app"

    # Google Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    USE_PRECOMPUTED: bool = True
    PERSISTENT_DISK: bool = False
    LOW_MEMORY_MODE: bool = True

    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "https://dev-pulse-lhnv-nine.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ]

    # Data & ETL paths
    DATA_DIR: str = "data"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [str(v)]

    @property
    def is_sqlite(self) -> bool:
        """Check if SQLite database is used (e.g. for lightweight testing)."""
        return self.DATABASE_URL.startswith("sqlite")

    def require_gemini_api_key(self) -> str:
        """Return the configured Gemini key.

        Empty means no model is configured: services then use their
        deterministic, data-grounded fallback explanations instead of
        raising at request time.
        """
        return self.GEMINI_API_KEY

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
