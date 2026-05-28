from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


def _normalize_database_url(url: str) -> str:
    # Render Postgres uses postgres://; SQLAlchemy expects postgresql://
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


engine = create_engine(_normalize_database_url(settings.database_url), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()