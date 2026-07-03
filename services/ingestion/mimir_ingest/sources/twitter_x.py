"""X (Twitter) API source — official candidate accounts and their posts.

API v2: https://developer.x.com/  (live). Feeds SocialAccount / SocialPost.
Computed neutrally: posting frequency, issue emphasis, engagement. Post sentiment,
if stored, describes the *post's* tone and is never aggregated into a candidate score
(see docs/NONPARTISAN_POLICY.md). Degrades gracefully if X_API_BEARER_TOKEN is unset.
"""

from __future__ import annotations

from typing import Any, Iterable

from ..config import settings
from .base import Record, RunContext, Source, SourceKind, SourceRef

X_BASE = "https://api.x.com/2"
SOURCE_NAME = "X (official candidate account)"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.X, name=SOURCE_NAME, url=url)


class XSource(Source):
    kind = SourceKind.X

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        if not settings.x_bearer_token:
            return []  # social features are optional
        """TODO: resolve each candidate's official handle, then GET /users/{id}/tweets."""
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Map a post payload -> SocialPost record (issueTags added by classifier)."""
        _ = _ref
        return []


def get_source() -> XSource:
    return XSource()
