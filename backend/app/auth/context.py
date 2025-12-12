"""
Request-scoped authentication context.

We store the current token_key (UserToken.token_key) in a ContextVar so that
code paths can call get_authenticated_service() without threading user.id
through every function.
"""

from contextvars import ContextVar


CURRENT_TOKEN_KEY: ContextVar[str] = ContextVar("current_token_key", default="default")


def set_current_token_key(token_key: str) -> None:
    """Set the current token key for this request context."""
    CURRENT_TOKEN_KEY.set(token_key)


def get_current_token_key() -> str:
    """Get the current token key for this request context."""
    return CURRENT_TOKEN_KEY.get()

