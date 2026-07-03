"""Minimal JSON HTTP GET helper built on the standard library.

We use urllib rather than httpx because httpx's happy-eyeballs (IPv6-first) dialing
can stall for ~14s per fresh connection in some sandboxed/CI networks before falling
back to IPv4, whereas urllib connects immediately. Retries use tenacity.
"""

from __future__ import annotations

import json
import socket
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .config import settings

# Force IPv4 DNS resolution. Some sandboxed networks stall for ~14s on the IPv6 (AAAA)
# lookup before falling back to IPv4, which makes every fresh connection appear to
# hang. Filtering getaddrinfo to AF_INET sidesteps that entirely. Applied once at
# import; harmless where IPv6 works fine.
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):  # noqa: A002
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)


socket.getaddrinfo = _ipv4_only_getaddrinfo


class HttpError(RuntimeError):
    def __init__(self, status: int, url: str, body: str) -> None:
        super().__init__(f"HTTP {status} for {url}: {body[:200]}")
        self.status = status
        self.url = url


@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, max=20),
    retry=retry_if_exception_type((urllib.error.URLError, TimeoutError)),
    reraise=True,
)
def get_json(url: str, params: dict[str, Any] | None = None, *, timeout: float = 30) -> Any:
    """GET a URL and parse JSON. Raises HttpError on non-2xx, URLError on transport."""
    if params:
        query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
        url = f"{url}?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": settings.user_agent})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:  # 4xx/5xx — don't retry client errors
        body = e.read().decode("utf-8", "replace") if e.fp else ""
        raise HttpError(e.code, url, body) from e
