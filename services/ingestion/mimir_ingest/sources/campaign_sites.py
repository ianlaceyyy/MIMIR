"""Candidate platform source — crawl official campaign websites.

No standardized API exists, so we crawl each candidate's official site (respecting
robots.txt and the configured user agent) and extract issues, policies, press
releases, speeches, policy PDFs, and news. The extracted TEXT is then handed to
classify/issues.py, which maps it to neutral issue categories and stores the
candidate's own verbatim quotes with citations — never a paraphrase by Mímir.
"""

from __future__ import annotations

from typing import Any, Iterable

from selectolax.parser import HTMLParser

from ..config import settings
from .base import Record, RunContext, Source, SourceKind, SourceRef

SOURCE_NAME = "Official campaign website"


def _ref(url: str) -> SourceRef:
    return SourceRef(kind=SourceKind.CAMPAIGN_SITE, name=SOURCE_NAME, url=url)


def extract_text(html: str) -> str:
    """Strip boilerplate, return readable text for the classifier."""
    tree = HTMLParser(html)
    for tag in tree.css("script, style, nav, footer, header"):
        tag.decompose()
    body = tree.body
    return body.text(separator=" ", strip=True) if body else ""


class CampaignSiteSource(Source):
    kind = SourceKind.CAMPAIGN_SITE

    def fetch(self, ctx: RunContext) -> Iterable[dict[str, Any]]:
        """TODO: for each candidate with a campaignWebsiteUrl, honor robots.txt,
        crawl issue/policy pages with settings.user_agent, and yield {url, html}."""
        _ = settings.user_agent
        return []

    def normalize(self, raw: dict[str, Any]) -> list[Record]:
        """Emit a lightweight 'PlatformDocument' payload for the classifier stage.

        IssueStance records are produced downstream by classify/issues.py so the
        LLM guardrails live in exactly one place.
        """
        _ = (extract_text, _ref)
        return []


def get_source() -> CampaignSiteSource:
    return CampaignSiteSource()
