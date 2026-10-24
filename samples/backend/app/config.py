"""
Application configuration using pydantic-settings.
Loads environment variables and provides typed settings access.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings
from sqlalchemy.engine import make_url
from typing import List

MIN_SECRET_KEY_LENGTH = 32
# 200 % a year: above this the value is almost certainly a percentage typed as a decimal (40 for 0.40).
MAX_RISK_FREE_RATE = 2.0

# Values that shipped in earlier versions of config.py, docker-compose.yml and
# .env.example. Anyone can read them in the repository, so they must never sign tokens.
KNOWN_PLACEHOLDER_SECRETS = {
    "super-secret-key-change-in-production",
    "supersecretkey_change_in_production",
    "change_this_to_a_random_secret_key_in_production",
}

# The database password docker-compose.yml and .env.example used to default to.
KNOWN_WEAK_DATABASE_PASSWORDS = {"", "postgres"}


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    # No default: docker-compose.yml builds it from POSTGRES_PASSWORD (see validator).
    DATABASE_URL: str

    # Security
    # No default: the app refuses to start without a strong key (see validator).
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # The refresh token lives in an httpOnly cookie (D-28). Secure keeps it off plain http;
    # browsers treat http://localhost as secure, so only a plain-http LAN/IP deployment needs false.
    COOKIE_SECURE: bool = True
    # A rotated refresh token may be presented again for this long (two tabs refreshing at
    # once, a retried request) before it counts as stolen and revokes the session.
    REFRESH_REUSE_GRACE_SECONDS: int = 10

    # API Keys
    GEMINI_API_KEY: str = ""
    # Gemini model used by every AI route; change it here (env) instead of in code.
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Rate limiting (per process; see app/utils/rate_limit.py)
    RATE_LIMIT_ENABLED: bool = True
    AI_RATE_LIMIT_PER_MINUTE: int = 10  # per user, across all Gemini-backed endpoints
    AUTH_RATE_LIMIT_PER_MINUTE: int = 20  # per client address: login, register, logout
    # Per client address, own counter: every page load restores the session with one refresh (KI-42, D-42).
    REFRESH_RATE_LIMIT_PER_MINUTE: int = 120
    LOGIN_MAX_FAILURES: int = 5  # wrong passwords per e-mail before a lockout
    LOGIN_FAILURE_WINDOW_SECONDS: int = 900
    # Trust the last X-Forwarded-For entry (set by the bundled nginx) as the client address.
    TRUST_PROXY_HEADERS: bool = False

    # Price alerts are checked by a background task in the API process (T-17).
    # 0 turns it off (the test suite does; POST /alerts/check still works).
    ALERT_CHECK_INTERVAL_SECONDS: int = 60
    # Read notifications older than this many days are deleted by the same background cycle
    # (KI-34, D-37); unread ones are kept. 0 keeps everything.
    NOTIFICATION_RETENTION_DAYS: int = 30

    # Annual risk-free rate used by the Sharpe ratio, as a decimal (0.40 = 40 %), applied to every
    # portfolio whatever its currency (D-32). Keep it near the deposit/policy rate of the main currency.
    RISK_FREE_RATE: float = 0.40

    # Environment
    ENVIRONMENT: str = "production"
    # Log every SQL statement (including parameters). Debugging only; never in production.
    SQL_ECHO: bool = False
    # Level of the application log (DEBUG, INFO, WARNING, ERROR, CRITICAL); unknown values mean INFO.
    LOG_LEVEL: str = "INFO"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        """Refuse to start with a missing, short or publicly known signing key."""
        if value in KNOWN_PLACEHOLDER_SECRETS or len(value) < MIN_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY en az {MIN_SECRET_KEY_LENGTH} karakter olmalı ve örnek değer olmamalı. "
                'Üretmek için: python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return value

    @field_validator("DATABASE_URL")
    @classmethod
    def database_password_must_not_be_default(cls, value: str) -> str:
        """Refuse an empty password or the old published default "postgres"."""
        if (make_url(value).password or "") in KNOWN_WEAK_DATABASE_PASSWORDS:
            raise ValueError(
                "DATABASE_URL şifresi boş ya da varsayılan 'postgres' olamaz; .env'de güçlü bir POSTGRES_PASSWORD tanımlayın."
            )
        return value

    @field_validator("ALERT_CHECK_INTERVAL_SECONDS")
    @classmethod
    def alert_check_interval_must_not_be_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("ALERT_CHECK_INTERVAL_SECONDS negatif olamaz (0 = kapalı).")
        return value

    @field_validator("NOTIFICATION_RETENTION_DAYS")
    @classmethod
    def notification_retention_must_not_be_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("NOTIFICATION_RETENTION_DAYS negatif olamaz (0 = silme).")
        return value

    @field_validator("RISK_FREE_RATE")
    @classmethod
    def risk_free_rate_must_be_an_annual_decimal(cls, value: float) -> float:
        if not 0 <= value <= MAX_RISK_FREE_RATE:
            raise ValueError(
                f"RISK_FREE_RATE 0 ile {MAX_RISK_FREE_RATE} arasında yıllık bir ondalık olmalı (0.40 = %40, 40 değil)."
            )
        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def cors_origins_must_be_explicit(cls, value: str) -> str:
        """Credentials are allowed, so "*" would let Starlette echo back any origin."""
        if "*" in (origin.strip() for origin in value.split(",")):
            raise ValueError("CORS_ORIGINS '*' içeremez; izinli origin'leri tek tek yazın.")
        return value

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS comma-separated string into a list (blank entries skipped)."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        # Old .env files may still carry removed settings (e.g. GNEWS_API_KEY); do not refuse to start.
        "extra": "ignore",
        "case_sensitive": True,
    }


settings = Settings()
