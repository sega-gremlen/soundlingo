from pydantic import BaseModel, EmailStr, Field


class SUserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    nickname: str


class SUserLogin(BaseModel):
    email: EmailStr
    password: str
