"""Branch-scoping middleware — extracts branch_id from JWT into request.state."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.auth.jwt import decode_token


class BranchScopeMiddleware(BaseHTTPMiddleware):
    """Extracts branch_id from Authorization header JWT and sets request.state.branch_id."""

    async def dispatch(self, request: Request, call_next):
        request.state.branch_id = None
        request.state.user_id = None
        request.state.user_role = None

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            payload = decode_token(token)
            if payload:
                request.state.branch_id = payload.get("branch_id")
                request.state.user_id = payload.get("sub")
                request.state.user_role = payload.get("role")

        response = await call_next(request)
        return response
