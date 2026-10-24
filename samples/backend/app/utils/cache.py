"""
Small in-process TTL cache for async loaders.

- Entries expire after a per-entry TTL; the TTL may depend on the loaded value
  (e.g. cache failures only briefly).
- Concurrent callers asking for the same missing key share one in-flight load
  instead of each hitting the upstream service.
- Least recently used entries are evicted beyond ``maxsize``.

Intended for a single event loop (one uvicorn worker). Values are shared
between callers and must be treated as read-only.
"""

import asyncio
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable, Hashable
from typing import Any

_MISSING = object()

Ttl = float | Callable[[Any], float]


class TTLCache:
    def __init__(self, maxsize: int = 1024, clock: Callable[[], float] = time.monotonic):
        self._maxsize = maxsize
        self._clock = clock
        self._entries: OrderedDict[Hashable, tuple[float, Any]] = OrderedDict()
        self._inflight: dict[Hashable, asyncio.Future] = {}

    def __len__(self) -> int:
        return len(self._entries)

    def get(self, key: Hashable, default: Any = None) -> Any:
        entry = self._entries.get(key)
        if entry is None:
            return default
        expires_at, value = entry
        if expires_at <= self._clock():
            del self._entries[key]
            return default
        self._entries.move_to_end(key)
        return value

    def set(self, key: Hashable, value: Any, ttl: float) -> None:
        if ttl <= 0:
            return
        self._entries[key] = (self._clock() + ttl, value)
        self._entries.move_to_end(key)
        while len(self._entries) > self._maxsize:
            self._entries.popitem(last=False)

    def clear(self) -> None:
        self._entries.clear()
        self._inflight.clear()

    async def get_or_load(self, key: Hashable, loader: Callable[[], Awaitable[Any]], ttl: Ttl) -> Any:
        """Return the cached value for ``key`` or load it once, sharing the load with concurrent callers."""
        value = self.get(key, _MISSING)
        if value is not _MISSING:
            return value

        inflight = self._inflight.get(key)
        if inflight is not None:
            return await asyncio.shield(inflight)

        future = asyncio.get_running_loop().create_future()
        self._inflight[key] = future
        try:
            value = await loader()
        except asyncio.CancelledError:
            future.cancel()
            raise
        except BaseException as exc:
            future.set_exception(exc)
            future.exception()  # mark as retrieved when nobody else was waiting
            raise
        else:
            self.set(key, value, ttl(value) if callable(ttl) else ttl)
            future.set_result(value)
            return value
        finally:
            self._inflight.pop(key, None)
