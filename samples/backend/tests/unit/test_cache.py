"""Unit tests for app.utils.cache.TTLCache."""

import asyncio

import pytest

from app.utils.cache import TTLCache


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def clock():
    return FakeClock()


@pytest.fixture
def cache(clock):
    return TTLCache(maxsize=3, clock=clock)


def test_entries_expire_after_ttl(cache, clock):
    cache.set("k", "v", ttl=10)
    clock.now += 9.9
    assert cache.get("k") == "v"
    clock.now += 0.1
    assert cache.get("k") is None


def test_non_positive_ttl_is_not_stored(cache):
    cache.set("k", "v", ttl=0)
    assert cache.get("k", "missing") == "missing"


def test_least_recently_used_entry_is_evicted(cache):
    for key in ("a", "b", "c"):
        cache.set(key, key, ttl=60)
    cache.get("a")  # "b" is now the least recently used
    cache.set("d", "d", ttl=60)

    assert cache.get("b") is None
    assert [cache.get(k) for k in ("a", "c", "d")] == ["a", "c", "d"]


async def test_get_or_load_caches_the_loaded_value(cache):
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        return {"price": 1}

    first = await cache.get_or_load("k", loader, ttl=60)
    second = await cache.get_or_load("k", loader, ttl=60)

    assert first == second == {"price": 1}
    assert calls == 1


async def test_ttl_can_depend_on_the_value(cache, clock):
    async def empty():
        return []

    await cache.get_or_load("k", empty, ttl=lambda value: 5 if not value else 60)
    clock.now += 6

    assert cache.get("k", "expired") == "expired"


async def test_concurrent_callers_share_one_load(cache):
    calls = 0
    release = asyncio.Event()

    async def slow_loader():
        nonlocal calls
        calls += 1
        await release.wait()
        return "value"

    tasks = [asyncio.create_task(cache.get_or_load("k", slow_loader, ttl=60)) for _ in range(5)]
    await asyncio.sleep(0)
    release.set()

    assert await asyncio.gather(*tasks) == ["value"] * 5
    assert calls == 1


async def test_failed_load_is_not_cached_and_reaches_waiters(cache):
    attempts = 0
    release = asyncio.Event()

    async def failing_loader():
        nonlocal attempts
        attempts += 1
        await release.wait()
        raise RuntimeError("upstream down")

    tasks = [asyncio.create_task(cache.get_or_load("k", failing_loader, ttl=60)) for _ in range(2)]
    await asyncio.sleep(0)
    release.set()
    results = await asyncio.gather(*tasks, return_exceptions=True)

    assert all(isinstance(result, RuntimeError) for result in results)
    assert attempts == 1
    assert cache.get("k") is None

    async def ok_loader():
        return "recovered"

    assert await cache.get_or_load("k", ok_loader, ttl=60) == "recovered"
