from fastapi import HTTPException, status

UserAlreadyExists = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Пользователь с таким email уже существует"
)

PasswordIncorrect = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Пароль должен быть длинной от 8 символов и "
           "содержать как минимум одну заглавную букву и одну цифру"
)

LoginError = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Нет такого пользователя или пароль неверный"
)

MissingAuthToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Пользователь не авторизован"
)

DecodeAuthTokenError = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Ошибка декодирования токена авторизации"
)

ExpiredAuthToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Время жизни токена авторизации закончилось"
)

MissingUserOnAuthToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Пользователя с подобным токеном авторизации не найдено"
)

WrongAuthToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="В токене отсутствуют необходимыме ключи"
)

UserIsNotverified = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Email не подтверждён. Пожалуйста, перейдите по ссылке в письме для завершения регистрации."
)

UserNotExist = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail='Пользователя с подобным email не найдено, обратитесь в поддержку'
)

ErrorOnAuthToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail='Ошибка при получении токена'
)
