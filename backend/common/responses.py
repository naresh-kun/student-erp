"""
Student ERP — Standardized REST API Response Builders
Enforces the authoritative envelope schema defined in docs/API_CONTRACT.md.
"""

from typing import Any, Dict, List, Optional
from rest_framework.response import Response
from rest_framework import status


def success_response(
    data: Any = None,
    meta: Optional[Dict[str, Any]] = None,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    """
    Constructs a standard successful API envelope response:
    {
        "success": true,
        "data": ...,
        "meta": { ... } // optional
    }
    """
    payload: Dict[str, Any] = {
        'success': True,
        'data': data if data is not None else {},
    }

    if meta is not None:
        payload['meta'] = meta

    if message is not None:
        payload['message'] = message

    return Response(payload, status=status_code)


def error_response(
    message: str,
    code: str = 'ERROR',
    details: Optional[List[Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """
    Constructs a standard error API envelope response:
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
    payload = {
        'success': False,
        'error': {
            'code': code,
            'message': message,
            'status_code': status_code,
            'details': details or [],
        }
    }
    return Response(payload, status=status_code)
