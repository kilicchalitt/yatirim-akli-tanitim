"""The signing key must be present, long enough and not a published placeholder."""

import pytest
from pydantic import ValidationError

from app.config import KNOWN_PLACEHOLDER_SECRETS, MIN_SECRET_KEY_LENGTH, Settings, settings


def make_settings(**overrides):
    # _env_file=None keeps the developer's real .env out of the test.
    return Settings(_env_file=None, **overrides)


def test_secret_key_is_required(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(ValidationError):
        make_settings()


def test_short_secret_key_is_rejected():
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="x" * (MIN_SECRET_KEY_LENGTH - 1))


@pytest.mark.parametrize("placeholder", sorted(KNOWN_PLACEHOLDER_SECRETS))
def test_published_placeholder_is_rejected(placeholder):
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY=placeholder)


def test_strong_secret_key_is_accepted():
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH).SECRET_KEY == "k" * MIN_SECRET_KEY_LENGTH


def test_gemini_model_defaults_and_can_be_overridden():
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH).GEMINI_MODEL == "gemini-3.5-flash-lite"
    overridden = make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, GEMINI_MODEL="gemini-other")
    assert overridden.GEMINI_MODEL == "gemini-other"


def test_wildcard_cors_origin_is_rejected():
    # With credentials allowed, "*" would make Starlette echo any origin back.
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, CORS_ORIGINS="http://localhost:3000,*")


def test_cors_origins_skip_blank_entries():
    configured = make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, CORS_ORIGINS="http://a.test, ,http://b.test,")

    assert configured.cors_origins_list == ["http://a.test", "http://b.test"]


@pytest.mark.parametrize("password", ["postgres", ""])
def test_default_or_empty_database_password_is_rejected(password):
    # The database is not published to the host, but its password is still the only lock
    # between any container on the network and every user's data.
    with pytest.raises(ValidationError):
        make_settings(
            SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH,
            DATABASE_URL=f"postgresql+asyncpg://postgres:{password}@postgres:5432/portfolio_tracker",
        )


def test_database_url_is_required(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH)


def test_strong_database_password_is_accepted():
    url = "postgresql+asyncpg://postgres:Zx9-long-random@postgres:5432/portfolio_tracker"

    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, DATABASE_URL=url).DATABASE_URL == url


def test_alert_check_interval_defaults_to_a_minute_and_zero_turns_it_off(monkeypatch):
    # tests/_db.py sets 0 for the whole suite; the default is what a deployment gets.
    monkeypatch.delenv("ALERT_CHECK_INTERVAL_SECONDS", raising=False)

    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH).ALERT_CHECK_INTERVAL_SECONDS == 60
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, ALERT_CHECK_INTERVAL_SECONDS=0).ALERT_CHECK_INTERVAL_SECONDS == 0


def test_negative_alert_check_interval_is_rejected():
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, ALERT_CHECK_INTERVAL_SECONDS=-1)


def test_the_test_suite_never_starts_the_alert_checker():
    assert settings.ALERT_CHECK_INTERVAL_SECONDS == 0


def test_risk_free_rate_defaults_to_forty_percent_and_can_be_overridden(monkeypatch):
    monkeypatch.delenv("RISK_FREE_RATE", raising=False)
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH).RISK_FREE_RATE == 0.40
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, RISK_FREE_RATE=0.045).RISK_FREE_RATE == 0.045


@pytest.mark.parametrize("value", [-0.01, 2.5, float("nan")])
def test_risk_free_rate_must_be_a_sane_annual_decimal(value):
    # 0.40 means 40 %; a percentage typed as 40 would silently make every Sharpe ratio hugely negative.
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, RISK_FREE_RATE=value)


def test_notification_retention_defaults_to_thirty_days_and_zero_turns_it_off(monkeypatch):
    monkeypatch.delenv("NOTIFICATION_RETENTION_DAYS", raising=False)

    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH).NOTIFICATION_RETENTION_DAYS == 30
    assert make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, NOTIFICATION_RETENTION_DAYS=0).NOTIFICATION_RETENTION_DAYS == 0


def test_negative_notification_retention_is_rejected():
    with pytest.raises(ValidationError):
        make_settings(SECRET_KEY="k" * MIN_SECRET_KEY_LENGTH, NOTIFICATION_RETENTION_DAYS=-1)
