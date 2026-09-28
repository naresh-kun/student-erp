"""
Student ERP — Test Common Response Envelopes & Exceptions
"""

from rest_framework import status
from common.responses import success_response, error_response
from common.exceptions import (
    custom_exception_handler,
    DomainValidationError,
    BusinessLogicError,
    ResourceNotFoundError,
    PermissionDeniedError,
    InvalidAttendanceStatusError,
    ImmutableFieldMutationError,
)


def test_success_response_envelope():
    response = success_response(data={'sample': 123}, meta={'page': 1, 'page_size': 20})
    assert response.status_code == status.HTTP_200_OK
    assert response.data['success'] is True
    assert response.data['data'] == {'sample': 123}
    assert response.data['meta'] == {'page': 1, 'page_size': 20}


def test_error_response_envelope():
    response = error_response(
        message="Invalid action",
        code="INVALID_ACTION",
        details=["Detail note"],
        status_code=status.HTTP_400_BAD_REQUEST
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data['success'] is False
    assert response.data['error']['code'] == "INVALID_ACTION"
    assert response.data['error']['message'] == "Invalid action"
    assert response.data['error']['details'] == ["Detail note"]


def test_custom_exception_handler_envelope():
    exc = DomainValidationError(message="Constraint violated", code="CONSTRAINT_VIOLATION")
    res = custom_exception_handler(exc, context={})
    assert res is not None
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert res.data['success'] is False
    assert res.data['error']['code'] == "CONSTRAINT_VIOLATION"


def test_domain_exceptions_status_codes():
    assert DomainValidationError().status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert BusinessLogicError().status_code == status.HTTP_400_BAD_REQUEST
    assert ResourceNotFoundError().status_code == status.HTTP_404_NOT_FOUND
    assert PermissionDeniedError().status_code == status.HTTP_403_FORBIDDEN
    assert InvalidAttendanceStatusError('LATE').status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert ImmutableFieldMutationError('student_id', 'STU1').status_code == status.HTTP_400_BAD_REQUEST
