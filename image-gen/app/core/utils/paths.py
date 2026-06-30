"""
Filesystem path containment helpers.

User-supplied layer specs can carry arbitrary `path` / `font.path` values that
flow into ``Image.open`` and ``ImageFont.truetype``. Without containment a
request could read any file the process can access (e.g. ``/etc/passwd``) or
escape the project tree via ``../`` sequences or symlinks. These helpers resolve
a candidate to its real, absolute location and confirm it stays inside one of
the directories the service is allowed to serve assets from.
"""

import os
from typing import Optional

from app.core.logging_config import get_logger

logger = get_logger("path_safety")

# Project root: app/core/utils/paths.py -> up three levels -> repo root.
_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

# Directories a request is permitted to read image/font assets from. The bundled
# asset library plus the per-request uploaded-logo staging area. Resolved with
# realpath so containment checks are symlink-safe on both sides.
_ALLOWED_ROOTS = tuple(
    os.path.realpath(os.path.join(_PROJECT_ROOT, sub))
    for sub in ("assets", os.path.join("uploads", "logos"))
)


def _is_within(child: str, parent: str) -> bool:
    """Return True when ``child`` is ``parent`` or lives beneath it."""
    try:
        common = os.path.commonpath([child, parent])
    except ValueError:
        # Raised when paths are on different drives / mixed absolute-relative.
        return False
    return common == parent


def resolve_allowed_asset_path(candidate: Optional[str]) -> Optional[str]:
    """
    Resolve ``candidate`` and return its real absolute path if it is contained
    within an allowed asset directory.

    Returns ``None`` when ``candidate`` is empty, escapes the allowed roots, or
    cannot be resolved. Callers treat ``None`` as "no usable path" and fall back
    to their existing missing-asset handling, so a rejected path degrades to a
    skipped/empty layer rather than an arbitrary file read.

    Both absolute and project-relative inputs are accepted: a relative path is
    joined onto the project root before resolution, matching the historical
    behaviour for bundled assets.
    """
    if not candidate:
        return None

    normalized = os.path.normpath(str(candidate))

    if os.path.isabs(normalized):
        base = normalized
    else:
        base = os.path.join(_PROJECT_ROOT, normalized)

    real = os.path.realpath(base)

    if any(_is_within(real, root) for root in _ALLOWED_ROOTS):
        return real

    logger.warning(
        "Rejected out-of-bounds asset path (resolved=%s); treating as missing",
        real,
    )
    return None
