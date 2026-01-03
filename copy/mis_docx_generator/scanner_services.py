from __future__ import annotations

import os
import re
from typing import Iterable

from .feature_catalog import Feature, FeatureCatalog, humanize_identifier
from .scanner_project import iter_files


HTTP_PATTERN = re.compile(
    r"\b(fetch|axios\.[a-zA-Z]+|get|post|put|patch|delete)\s*\(",
    re.IGNORECASE,
)


def _iter_service_files(base_path: str) -> Iterable[str]:
    if not base_path or not os.path.isdir(base_path):
        return
    yield from iter_files(base_path, (".ts", ".js"))


def populate_services(project_root: str, src_path: str, customers_path: str, catalog: FeatureCatalog) -> None:
    """
    Scan service and API files to infer backend capabilities and key APIs.
    """
    # Core app services
    src_services = os.path.join(src_path, "services") if src_path else None
    api_config = os.path.join(src_path, "config", "api.ts") if src_path else None

    service_files = []
    if src_services and os.path.isdir(src_services):
        service_files.extend(list(_iter_service_files(src_services)))
    if api_config and os.path.isfile(api_config):
        service_files.append(api_config)

    # Customer/CRM services
    if customers_path:
        crm_services = os.path.join(customers_path, "customers", "services")
        if os.path.isdir(crm_services):
            service_files.extend(list(_iter_service_files(crm_services)))

    for file_path in service_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue

        if not HTTP_PATTERN.search(content):
            # Skip files that do not appear to make HTTP/API calls
            continue

        rel = os.path.relpath(file_path, project_root)
        folder = os.path.dirname(rel)

        # Determine domain heuristically
        domain_name = "Integrations & APIs"
        if "customers" in rel:
            domain_name = "CRM & Customer Management"

        module_name_raw = os.path.basename(folder) or "Services"
        module_name = humanize_identifier(module_name_raw)
        service_name = humanize_identifier(os.path.basename(file_path))

        calls = sorted(set(m.group(1) for m in HTTP_PATTERN.finditer(content)))
        calls_str = ", ".join(calls) if calls else "HTTP operations"

        business = (
            f"{service_name} exposes application operations over HTTP, supporting "
            f"data exchange and integration in the {domain_name} area."
        )
        technical = (
            f"Implemented in `{rel}`, this service module performs {calls_str} "
            "requests to backend APIs and external services."
        )

        domain = catalog.get_or_create_domain(domain_name)
        module = domain.get_or_create_module(name=module_name, path=folder)
        feature = Feature(
            name=service_name,
            summary_business=business,
            summary_technical=technical,
            key_apis=[rel],
            tags=["service", "api"],
        )
        module.add_feature(feature)


