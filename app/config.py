from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "Previous Year Paper Finder"
    database_path: Path = ROOT_DIR / "data" / "papers.db"
    papers_dir: Path = ROOT_DIR / "data" / "papers"

    ftp_host: str = "103.220.82.76"
    ftp_port: int = 21
    ftp_user: str = "anonymous"
    ftp_password: str = ""
    ftp_root: str = "/"
    ftp_timeout: int = 30
    ftp_passive: bool = True
    ftp_encoding: str = "cp1252"
    ftp_use_mlsd: bool = False
    ftp_retries: int = 2
    ftp_try_alternate_mode: bool = True

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def ensure_paths(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.papers_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_paths()
    return settings
