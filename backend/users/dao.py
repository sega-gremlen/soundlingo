from backend.dao.base import BaseDAO
from backend.users.models import Users


class UsersDAO(BaseDAO):
    model = Users
