"""Custom exception hierarchy — maps to HTTP status codes via exception handlers."""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""

    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppException):
    def __init__(self, entity: str = "Resource", id: str = ""):
        detail = f"{entity} not found" + (f": {id}" if id else "")
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class BadRequestError(AppException):
    def __init__(self, detail: str = "Invalid request"):
        super().__init__(detail=detail, status_code=status.HTTP_400_BAD_REQUEST)


class ValidationError(BadRequestError):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(detail=detail)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)

