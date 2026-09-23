"""
Student ERP — Custom DRF Exception Handling
Normalizes error responses to standard JSON format
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Standard envelope error formatter:
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "details": [...]
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'success': False,
            'error': {
                'code': exc.__class__.__name__,
                'message': str(exc),
                'status_code': response.status_code,
                'details': response.data if isinstance(response.data, (dict, list)) else [str(response.data)]
            }
        }
        return Response(error_payload, status=response.status_code)

    return response
