import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    APP_NAME: str = "AI Impact & Developer Productivity Dashboard API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database Configuration (PostgreSQL 16 via Supabase, Railway, or local)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/devpulse"

    # Google Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
