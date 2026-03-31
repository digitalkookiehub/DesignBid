from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "DesignBid - Interior Design Proposals"
    DATABASE_URL: str = "postgresql://designbid:password@localhost:5432/designbid"
    SECRET_KEY: str = "change-this-to-a-secure-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:80",
    ]

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@designbid.com"

    # File Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB

    # AI (Local Ollama)
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:4b"

    # URLs
    APP_URL: str = "http://localhost:5174"
    API_URL: str = "http://localhost:8003"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
