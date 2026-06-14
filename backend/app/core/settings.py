from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = Field(default="Bet Tracker API", alias="APP_NAME")
    database_url: str = Field(
        default="sqlite:///./bet_tracker.db", alias="DATABASE_URL"
    )
    allowed_origins: str = Field(
        default="http://localhost:5173", alias="ALLOWED_ORIGINS"
    )
    sports_api_url: str = Field(default="", alias="SPORTS_API_URL")
    sports_api_key: str = Field(default="", alias="SPORTS_API_KEY")
    sports_api_league: str = Field(default="39", alias="SPORTS_API_LEAGUE")
    sports_api_season: str = Field(default="2026", alias="SPORTS_API_SEASON")
    jwt_secret: str = Field(default="changeme", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_exp_seconds: int = Field(default=86400, alias="JWT_EXP_SECONDS")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
