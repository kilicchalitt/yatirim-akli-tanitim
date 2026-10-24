import logging


from app.utils.logging_config import parse_level, setup_logging


def test_parse_level_accepts_any_case():
    assert parse_level("debug") == logging.DEBUG
    assert parse_level("WARNING") == logging.WARNING


def test_parse_level_falls_back_to_info_for_garbage():
    assert parse_level("loud") == logging.INFO
    assert parse_level("") == logging.INFO


def test_setup_logging_is_idempotent_and_sets_level():
    logger = logging.getLogger("app")
    before = len(logger.handlers)
    setup_logging("ERROR")
    setup_logging("ERROR")
    try:
        assert logger.level == logging.ERROR
        assert len(logger.handlers) <= before + 1
    finally:
        setup_logging("INFO")
