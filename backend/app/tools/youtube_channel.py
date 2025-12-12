"""
Shared helpers for resolving the authenticated user's YouTube channel.

Keeping this logic in one place avoids duplicated API calls and inconsistent
errors across routers and tools.
"""

from fastapi import HTTPException
from googleapiclient.discovery import Resource


def resolve_mine_channel_id(youtube: Resource) -> str:
    """Resolve the current OAuth user's primary YouTube channel id."""
    resp = youtube.channels().list(part="id", mine=True).execute()
    items = resp.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No YouTube channel found for user")
    return items[0]["id"]

