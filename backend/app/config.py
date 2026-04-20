from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Coach Mobile API"
    app_env: str = "development"
    app_version: str = "0.1.0"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
