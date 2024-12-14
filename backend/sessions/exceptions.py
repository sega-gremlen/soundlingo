from fastapi import HTTPException, status

TrackNotFoundError = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Трек не найден"
)

LyricsOrSourceNotAvailableError = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Нет слов или mp3 трека, попробуй выбрать другой"
)

SessionFoundError = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Нет такой сессии"
)
