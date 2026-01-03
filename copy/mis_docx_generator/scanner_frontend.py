from __future__ import annotations

import os
from typing import Iterable

from .feature_catalog import Feature, FeatureCatalog, humanize_identifier
from .scanner_project import iter_files


FRONTEND_DOMAIN_MAP = {
    "attendance": "Attendance Management",
    "classes": "Class & Timetable Management",
    "students": "Student Information Management",
    "teachers": "Teacher Information Management",
    "exams": "Examinations & Assessment",
    "finance": "Finance & Fees",
    "gradeManagement": "Grades & Academic Performance",
    "parentPortal": "Parent Portal",
    "teacherPortal": "Teacher Portal",
    "superadmin": "Administration & Configuration",
    "superduperadmin": "Advanced Administration",
    "customers": "CRM & Customer Management",
}


def _derive_domain_from_path(path: str) -> str:
    parts = path.split(os.sep)
    for part in parts:
        if part in FRONTEND_DOMAIN_MAP:
            return FRONTEND_DOMAIN_MAP[part]
    # Fallback generic domain
    return "General Application Features"


def _iter_relevant_frontend_files(layout_src: str) -> Iterable[str]:
    feature_root = os.path.join(layout_src, "features")
    components_root = os.path.join(layout_src, "components")

    if os.path.isdir(feature_root):
        yield from iter_files(feature_root, (".tsx", ".jsx"))
    if os.path.isdir(components_root):
        yield from iter_files(components_root, (".tsx", ".jsx"))


def populate_frontend_features(layout_src: str, catalog: FeatureCatalog) -> None:
    """
    Populate the feature catalog based on the frontend folder structure
    (features, components). This is heuristic but gives a good high‑level
    picture of domains, modules, and screens.
    """
    if not layout_src or not os.path.isdir(layout_src):
        return

    for file_path in _iter_relevant_frontend_files(layout_src):
        rel = os.path.relpath(file_path, layout_src)
        domain_name = _derive_domain_from_path(rel)

        folder = os.path.dirname(rel)
        module_name_raw = os.path.basename(folder) or "Root Module"
        module_name = humanize_identifier(module_name_raw)

        file_name = os.path.basename(file_path)
        feature_name = humanize_identifier(file_name)

        domain = catalog.get_or_create_domain(domain_name)
        module = domain.get_or_create_module(name=module_name, path=folder)

        business = (
            f"{feature_name} is part of the {module_name} module in the "
            f"{domain_name} domain."
        )
        technical = (
            f"Implemented as a React component in `{rel}`, this element contributes "
            f"to the {module_name} frontend experience within the {domain_name} area."
        )

        feature = Feature(
            name=feature_name,
            summary_business=business,
            summary_technical=technical,
            main_screens=[rel],
        )
        module.add_feature(feature)


