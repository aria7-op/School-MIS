from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ProjectLayout:
    root: str
    src: Optional[str] = None
    customers: Optional[str] = None
    public_locales: Optional[str] = None


def discover_project(root_path: str) -> ProjectLayout:
    """
    Discover key folders in the MIS project.
    """
    root_path = os.path.abspath(root_path)

    src = os.path.join(root_path, "src")
    if not os.path.isdir(src):
        src = None

    customers = os.path.join(root_path, "customers")
    if not os.path.isdir(customers):
        customers = None

    public_locales = os.path.join(root_path, "public", "locales")
    if not os.path.isdir(public_locales):
        public_locales = None

    return ProjectLayout(
        root=root_path,
        src=src,
        customers=customers,
        public_locales=public_locales,
    )


def iter_files(base_path: str, extensions: Optional[tuple[str, ...]] = None):
    """
    Yield absolute file paths under base_path, optionally filtered by extensions.
    """
    for dirpath, _, filenames in os.walk(base_path):
        for filename in filenames:
            if extensions is not None:
                if not filename.lower().endswith(extensions):
                    continue
            yield os.path.join(dirpath, filename)


def summarize_tree(base_path: str) -> Dict[str, int]:
    """
    Very light summary: count files by extension under a path.
    Useful for high‑level technical description.
    """
    counts: Dict[str, int] = {}
    if not os.path.isdir(base_path):
        return counts

    for _, _, filenames in os.walk(base_path):
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower() or "<none>"
            counts[ext] = counts.get(ext, 0) + 1
    return counts


