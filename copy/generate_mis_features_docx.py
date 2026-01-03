from __future__ import annotations

import argparse
import os
import sys

from mis_docx_generator import FeatureCatalog
from mis_docx_generator.docx_builder import build_docx
from mis_docx_generator.scanner_auth_localization import (
    populate_auth_and_roles,
    populate_localization,
)
from mis_docx_generator.scanner_frontend import populate_frontend_features
from mis_docx_generator.scanner_project import discover_project
from mis_docx_generator.scanner_services import populate_services


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scan the MIS codebase and generate a client‑ready DOCX document "
            "describing system features and technical structure."
        )
    )
    parser.add_argument(
        "--project-root",
        type=str,
        default=".",
        help="Path to the MIS project root (default: current directory).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="mis_features.docx",
        help="Path to the output DOCX file (default: mis_features.docx).",
    )
    parser.add_argument(
        "--system-name",
        type=str,
        default="School Management Information System (MIS)",
        help="Display name of the system for the title page.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    layout = discover_project(args.project_root)
    catalog = FeatureCatalog()

    # Frontend features and screens
    if layout.src:
        populate_frontend_features(layout.src, catalog)

    # Services and APIs
    populate_services(
        project_root=layout.root,
        src_path=layout.src or "",
        customers_path=layout.customers or "",
        catalog=catalog,
    )

    # Authentication, roles, localization
    if layout.src:
        populate_auth_and_roles(layout.src, catalog)
    if layout.public_locales:
        populate_localization(layout.public_locales, layout.src or "", catalog)

    if not catalog.domains:
        print(
            "Warning: no domains or features were discovered. "
            "Check that --project-root points to the MIS project.",
            file=sys.stderr,
        )

    output_path = build_docx(
        catalog=catalog,
        project_root=layout.root,
        output_path=args.output,
        system_name=args.system_name,
    )

    print(f"DOCX feature document generated at: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


