"""
Student ERP — Custom DRF & Domain Exception Handling
Normalizes all errors to standard JSON format:
{
    "success": false,
    "error": {
        "code": "...",
        "message": "...",
        "status_code": 400,
        "details": [...]
    }
}
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from rest_framework import status

logger = logging.getLogger(__name__)


# ============================================================================
# Domain Exceptions
# ============================================================================
class StudentERPException(APIException):
    """Base class for all Student ERP domain exceptions."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A domain business logic exception occurred."
    default_code = "DOMAIN_ERROR"

    def __init__(self, message=None, code=None, status_code=None, details=None):
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.default_code = code
        self.details = details or []
        super().__init__(detail=message or self.default_detail, code=code or self.default_code)


class DomainValidationError(StudentERPException):
    """Raised when domain constraints or invariants are violated."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "Validation failed for domain entity."
    default_code = "VALIDATION_ERROR"


class BusinessLogicError(StudentERPException):
    """Raised when an operation violates a business workflow or rule."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Business rule violation."
    default_code = "BUSINESS_RULE_VIOLATION"


class ResourceNotFoundError(StudentERPException):
    """Raised when a requested domain entity is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Requested resource was not found."
    default_code = "NOT_FOUND"


class PermissionDeniedError(StudentERPException):
    """Raised when an actor lacks authorization for a domain operation."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Permission denied for this operation."
    default_code = "PERMISSION_DENIED"


class InvalidAttendanceStatusError(DomainValidationError):
    """
    Raised when an invalid attendance status is provided,
    particularly deprecated legacy statuses like LATE or EXCUSED.
    """
    default_code = "INVALID_ATTENDANCE_STATUS"

    def __init__(self, invalid_status):
        message = (
            f"Invalid attendance status: '{invalid_status}'. "
            f"Canonical allowed statuses are: PRESENT, ABSENT, ON_DUTY, LEAVE. "
            f"Legacy statuses (LATE, EXCUSED) are strictly prohibited per Master Plan Amendment 2."
        )
        super().__init__(message=message, code=self.default_code)


class ImmutableFieldMutationError(BusinessLogicError):
    """Raised when an attempt is made to mutate an immutable identifier (e.g. Student ID)."""
    default_code = "IMMUTABLE_FIELD_MUTATION"

    def __init__(self, field_name, value):
        message = f"Field '{field_name}' is permanently immutable (current value: '{value}'). Modification is prohibited."
        super().__init__(message=message, code=self.default_code)


# ============================================================================
# Global DRF Exception Handler
# ============================================================================
from django.core.exceptions import ValidationError as DjangoValidationError, ObjectDoesNotExist
from django.http import Http404


def custom_exception_handler(exc, context):
    """
    Standard envelope error formatter:
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "status_code": 400,
            "details": [...]
        }
    }
    """
    response = exception_handler(exc, context)

    if response is None:
        if isinstance(exc, DjangoValidationError):
            details = []
            if hasattr(exc, 'message_dict'):
                details = [exc.message_dict]
            elif hasattr(exc, 'messages'):
                details = exc.messages
            else:
                details = [str(exc)]
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Validation failed for entity.',
                        'status_code': status.HTTP_400_BAD_REQUEST,
                        'details': details,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif isinstance(exc, (ObjectDoesNotExist, Http404)):
            return Response(
                {
                    'success': False,
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': str(exc) or 'Requested resource was not found.',
                        'status_code': status.HTTP_404_NOT_FOUND,
                        'details': [],
                    }
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    if response is not None:
        details = []
        if isinstance(response.data, dict):
            details = [response.data]
        elif isinstance(response.data, list):
            details = response.data
        elif response.data is not None:
            details = [str(response.data)]

        # Custom exception detail attributes if present
        if hasattr(exc, 'details') and exc.details:
            details = exc.details

        # Error code resolution
        code = getattr(exc, 'default_code', exc.__class__.__name__)
        if hasattr(exc, 'get_codes'):
            try:
                raw_code = exc.get_codes()
                if isinstance(raw_code, str):
                    code = raw_code.upper()
            except Exception:
                pass

        if isinstance(exc, Http404) or (response.status_code == 404 and str(code).lower() in ('http404', 'not_found', 'notfound')):
            code = 'NOT_FOUND'
        elif isinstance(code, str):
            code = code.upper()

        message = str(getattr(exc, 'detail', str(exc)))

        error_payload = {
            'success': False,
            'error': {
                'code': str(code),
                'message': message,
                'status_code': response.status_code,
                'details': details,
            }
        }
        return Response(error_payload, status=response.status_code)

    return response
