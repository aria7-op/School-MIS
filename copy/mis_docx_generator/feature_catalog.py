from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


def humanize_identifier(name: str) -> str:
    """
    Convert identifiers like 'AttendanceCalendarView' or 'attendance_calendar_view'
    into a human readable form: 'Attendance Calendar View'.
    """
    import re

    if not name:
        return ""

    # Remove file extension if present
    name = name.rsplit(".", 1)[0]

    # Replace separators with spaces
    name = name.replace("_", " ").replace("-", " ")

    # Split camelCase / PascalCase into words
    name = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", name)

    # Collapse multiple spaces and title case
    name = re.sub(r"\s+", " ", name).strip()
    return name.title()


@dataclass
class Feature:
    name: str
    summary_business: str = ""
    summary_technical: str = ""
    main_screens: List[str] = field(default_factory=list)
    key_apis: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


@dataclass
class Module:
    name: str
    path: str
    features: List[Feature] = field(default_factory=list)

    def add_feature(self, feature: Feature) -> None:
        self.features.append(feature)


@dataclass
class Domain:
    name: str
    modules: List[Module] = field(default_factory=list)

    def get_or_create_module(self, name: str, path: str) -> Module:
        for module in self.modules:
            if module.name == name and module.path == path:
                return module
        module = Module(name=name, path=path)
        self.modules.append(module)
        return module


@dataclass
class FeatureCatalog:
    """
    Aggregated view of MIS domains, modules and features.
    """

    domains: Dict[str, Domain] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def get_or_create_domain(self, name: str) -> Domain:
        if name not in self.domains:
            self.domains[name] = Domain(name=name)
        return self.domains[name]

    def all_domains_sorted(self) -> List[Domain]:
        return sorted(self.domains.values(), key=lambda d: d.name.lower())

    def infer_high_level_summary(self) -> str:
        """
        Build a short, business‑friendly summary of the MIS based on
        discovered domains.
        """
        if not self.domains:
            return (
                "This Management Information System (MIS) provides a modular "
                "platform for managing core school operations, academic data, "
                "and user access."
            )

        domain_names = [d.name for d in self.all_domains_sorted()]
        joined = ", ".join(domain_names)
        return (
            "This Management Information System (MIS) delivers a comprehensive, "
            "modular platform covering key domains such as "
            f"{joined}. It is designed to support day‑to‑day school operations, "
            "reporting, and decision‑making for administrators, teachers, and other stakeholders."
        )

    def get_supported_locales(self) -> List[str]:
        locales = self.metadata.get("locales", [])
        if not isinstance(locales, list):
            return []
        return sorted({str(loc) for loc in locales})


