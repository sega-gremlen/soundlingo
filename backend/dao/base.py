from sqlalchemy import select, insert

from backend.dao.creator import async_sessionmaker


class BaseDAO:
    model = None

    @classmethod
    async def create(cls, **data):
        async with async_sessionmaker() as session:
            querry = insert(cls.model).values(**data).returning(cls.model)
            result = await session.execute(querry)
            await session.commit()
            return result.scalar()

    @classmethod
    async def find_one_or_none(cls, *filter_by):
        async with async_sessionmaker() as session:
            querry = select(cls.model).filter(*filter_by)
            result = await session.execute(querry)
            return result.scalar_one_or_none()

    @staticmethod
    async def patch(model_obj, **data):
        async with async_sessionmaker() as session:
            # Убедитесь, что объект существует в базе данных
            existing_obj = await session.get(type(model_obj), model_obj.id)
            if existing_obj is None:
                raise ValueError("Объект не найден в базе данных")

            # Обновляем атрибуты объекта
            for key, value in data.items():
                setattr(existing_obj, key, value)

            # Не нужно добавлять объект снова, если он уже существует
            await session.commit()

    @classmethod
    async def find_all(cls, *filter_by):
        async with async_sessionmaker() as session:
            querry = select(cls.model).filter(*filter_by)
            result = await session.execute(querry)
            return result.scalars().all()
