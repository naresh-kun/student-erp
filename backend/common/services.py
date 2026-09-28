"""
Student ERP — Shared Base Service Architecture
Authoritative service layer foundation adhering to the modular monolith pattern:
Fat models / Thin views / Dedicated services.
"""

import logging
from contextlib import contextmanager
from typing import Any, Dict, Optional
from django.db import transaction
from common.exceptions import BusinessLogicError, DomainValidationError, ResourceNotFoundError


class BaseService:
    """
    Abstract base service encapsulating domain workflows,
    transactional boundaries, and standardized error handling.
    """

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__module__)

    @contextmanager
    def atomic(self):
        """
        Transactional context manager ensuring atomic execution of multi-table domain operations.
        Rolls back automatically on unhandled exception.
        """
        with transaction.atomic():
            yield

    def validate_required_fields(self, data: Dict[str, Any], required_fields: list):
        """Validates that all required fields are present and not empty."""
        missing = [field for field in required_fields if field not in data or data[field] is None or data[field] == '']
        if missing:
            raise DomainValidationError(
                message=f"Missing required field(s): {', '.join(missing)}",
                code="MISSING_REQUIRED_FIELDS",
                details=[{"field": f, "issue": "Field is required"} for f in missing],
            )

    def raise_not_found(self, entity_name: str, identifier: Any):
        """Standardized helper for resource not found errors."""
        self.logger.warning("%s with identifier '%s' not found", entity_name, identifier)
        raise ResourceNotFoundError(
            message=f"{entity_name} with identifier '{identifier}' was not found.",
            code="NOT_FOUND",
        )

    def raise_business_error(self, message: str, code: str = "BUSINESS_RULE_VIOLATION", details: Optional[list] = None):
        """Standardized helper for business logic rejections."""
        self.logger.warning("Business logic error: %s (%s)", message, code)
        raise BusinessLogicError(message=message, code=code, details=details)
