from backend.dao.base import BaseDAO
from backend.session_requests.models import SessionRequests


class SessionRequestsDAO(BaseDAO):
    model = SessionRequests
