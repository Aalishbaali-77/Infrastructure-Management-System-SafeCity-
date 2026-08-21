from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


class StandardCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200
    ordering = '-created_at'

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'pagination': {
                'next_cursor': self.get_next_link(),
                'previous_cursor': self.get_previous_link(),
                'page_size': self.page_size,
                'has_more': self.has_next,
            },
        })