from __future__ import annotations

import os
from typing import List

from .feature_catalog import Feature, FeatureCatalog, humanize_identifier
from .scanner_project import iter_files


def populate_auth_and_roles(src_path: str, catalog: FeatureCatalog) -> None:
    if not src_path or not os.path.isdir(src_path):
        return

    auth_root = os.path.join(src_path, "auth")
    contexts_root = os.path.join(src_path, "contexts")

    if not os.path.isdir(auth_root) and not os.path.isdir(contexts_root):
        return

    domain = catalog.get_or_create_domain("Authentication, Security & Access Control")

    # Auth screens/components
    if os.path.isdir(auth_root):
        for file_path in iter_files(auth_root, (".tsx", ".ts", ".jsx", ".js")):
            rel = os.path.relpath(file_path, src_path)
            folder = os.path.dirname(rel)
            module = domain.get_or_create_module(
                name=humanize_identifier(os.path.basename(folder) or "Auth"),
                path=folder,
            )
            feature = Feature(
                name=humanize_identifier(os.path.basename(file_path)),
                summary_business=(
                    "Supports secure authentication and access to the MIS for different user groups."
                ),
                summary_technical=(
                    f"Authentication‑related logic implemented in `{rel}`, typically "
                    "covering login, sessions, and guard components or hooks."
                ),
                main_screens=[rel],
                tags=["auth", "security"],
            )
            module.add_feature(feature)

    # Access‑control related contexts
    if os.path.isdir(contexts_root):
        for file_path in iter_files(contexts_root, (".tsx", ".ts", ".jsx", ".js")):
            name = os.path.basename(file_path)
            if "AccessControl" not in name and "Role" not in name and "Auth" not in name:
                continue

            rel = os.path.relpath(file_path, src_path)
            folder = os.path.dirname(rel)
            module = domain.get_or_create_module(
                name="Role-Based Access Control",
                path=folder,
            )
            feature = Feature(
                name=humanize_identifier(name),
                summary_business=(
                    "Provides fine‑grained, role‑based access control to ensure that "
                    "users only see and manage data appropriate to their role."
                ),
                summary_technical=(
                    f"Context and helpers for RBAC implemented in `{rel}`; used to "
                    "enforce permissions across the frontend."
                ),
                main_screens=[rel],
                tags=["rbac", "roles", "security"],
            )
            module.add_feature(feature)


def populate_localization(public_locales_path: str, src_path: str, catalog: FeatureCatalog) -> None:
    if not public_locales_path or not os.path.isdir(public_locales_path):
        return

    locales: List[str] = []
    for entry in os.listdir(public_locales_path):
        full = os.path.join(public_locales_path, entry)
        if os.path.isdir(full):
            locales.append(entry)

    existing = set(catalog.metadata.get("locales", []))
    existing.update(locales)
    catalog.metadata["locales"] = sorted(existing)

    if not locales:
        return

    domain = catalog.get_or_create_domain("Localization & Multi‑Language Support")
    module = domain.get_or_create_module(
        name="Localization",
        path=os.path.relpath(public_locales_path, os.path.dirname(src_path)) if src_path else "public/locales",
    )

    feature = Feature(
        name="Multi‑Language User Interface",
        summary_business=(
            "The MIS supports a multi‑language user interface, allowing users to "
            "work in their preferred language and improving accessibility."
        ),
        summary_technical=(
            "Localization resources are stored under the `public/locales` directory "
            "and wired through the i18n configuration in the frontend."
        ),
        tags=["i18n", "localization"],
    )
    module.add_feature(feature)


