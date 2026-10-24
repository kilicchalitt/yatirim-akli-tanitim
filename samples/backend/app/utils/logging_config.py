"""
Application logging.

One line per record, ``key=value`` pairs after a fixed prefix, written to
stderr by a handler on the ``app`` logger (so the ``app.access`` request log and
``app.migrate`` share it). The level comes from ``LOG_LEVEL``. SQL statements
are controlled separately by ``SQL_ECHO``.
"""

import logging

LOG_FORMAT = "%(asctime)s level=%(levelname)s logger=%(name)s %(message)s"
_HANDLER_NAME = "app-stderr"


def parse_level(value: str) -> int:
    """Map a level name (any case) to a logging level; unknown names mean INFO."""
    level = logging.getLevelName(str(value).strip().upper())
    return level if isinstance(level, int) else logging.INFO


def setup_logging(level: str = "INFO") -> None:
    """Attach one stderr handler to the ``app`` logger and set its level. Safe to call repeatedly."""
    logger = logging.getLogger("app")
    logger.setLevel(parse_level(level))
    if not any(h.get_name() == _HANDLER_NAME for h in logger.handlers):
        handler = logging.StreamHandler()
        handler.set_name(_HANDLER_NAME)
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)
