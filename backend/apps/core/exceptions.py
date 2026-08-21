from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get('request')

    if response is None:
        if isinstance(exc, ProtectedError):
            blocking = [str(obj) for obj in exc.protected_objects][:10]
            problem = {
                "type": "about:blank",
                "title": "Conflict",
                "status": status.HTTP_409_CONFLICT,
                "detail": (
                    "This item cannot be deleted because it is still "
                    "referenced by other records."
                ),
                "instance": request.path if request else "",
                "blocking_items": blocking,
            }
            return Response(problem, status=status.HTTP_409_CONFLICT)
        return None

    detail = response.data
    if isinstance(detail, dict) and 'detail' in detail:
        detail_message = detail['detail']
    else:
        detail_message = str(detail)

    problem = {
        "type": "about:blank",
        "title": response.status_text if hasattr(response, 'status_text') else "Error",
        "status": response.status_code,
        "detail": detail_message,
        "instance": request.path if request else "",
    }

    response.data = problem
    return response