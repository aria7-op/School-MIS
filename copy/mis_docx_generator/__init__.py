"""
MIS Feature DOCX generator.

This package scans the MIS codebase (frontend features, services, auth,
localization, CRM customers) and builds a feature catalog that can be
rendered into a polished DOCX document for clients.
"""

from .feature_catalog import FeatureCatalog

__all__ = ["FeatureCatalog"]


