import os

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.orm import declarative_base

    # Use SQLite for local dev (no Docker needed)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///stockseer.db")

    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    Base = declarative_base()

    async def get_db():
        async with AsyncSessionLocal() as session:
            yield session

    SQLALCHEMY_AVAILABLE = True

except ImportError:
    # Graceful fallback — backend runs without the news DB
    print("[WARNING] SQLAlchemy not available. News DB features will be disabled.")
    SQLALCHEMY_AVAILABLE = False
    class Base:
        pass
    engine = None
    AsyncSessionLocal = None

    async def get_db():
        yield None
