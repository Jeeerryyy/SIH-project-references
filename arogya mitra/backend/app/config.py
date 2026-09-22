"""Application settings — single source of truth for all configuration."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./arogya_mitra.db"

    # Auth / JWT
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # App
    ENVIRONMENT: str = "development"
    APP_TITLE: str = "Arogya Mitra API"
    APP_VERSION: str = "1.0.0"

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL


settings = Settings()
