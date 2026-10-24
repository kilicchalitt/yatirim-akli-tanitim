"""
Access log middleware: one ``key=value`` line per HTTP request.

Logged: method, path (never the query string), status, duration and the
authenticated user id (set by ``get_current_user``). Request headers, bodies and
query strings are not read, so tokens, passwords and API keys cannot leak.
Levels: 5xx error, 4xx warning (401/403/429 stay visible), the rest info.
It is a pure ASGI middleware so streaming (SSE) responses are not buffered.
"""

import logging
import time

logger = logging.getLogger("app.access")


class RequestLoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        started = time.perf_counter()
        status = 500

        async def send_wrapper(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            user_id = scope.get("state", {}).get("user_id")
            level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
            logger.log(
                level,
                "method=%s path=%s status=%d duration_ms=%.1f user_id=%s",
                scope["method"],
                scope["path"],
                status,
                duration_ms,
                user_id if user_id is not None else "-",
            )
