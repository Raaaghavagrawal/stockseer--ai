import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, BigInteger, DECIMAL, Text, TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

class User(Base):
    __tablename__ = "users"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    subscription_tier = Column(String(50), default="free")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    portfolios = relationship("Portfolio", back_populates="user")

class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="portfolios")

class AISignal(Base):
    __tablename__ = "ai_signals"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), nullable=False, index=True)
    signal_type = Column(String(20)) # 'Bullish', 'Bearish'
    confidence = Column(DECIMAL)
    reasoning = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class StockQuote(Base):
    """
    Time-series table meant to be converted to a TimescaleDB hypertable
    """
    __tablename__ = "stock_quotes"
    time = Column(DateTime(timezone=True), primary_key=True)
    symbol = Column(String(20), primary_key=True)
    open = Column(DECIMAL)
    high = Column(DECIMAL)
    low = Column(DECIMAL)
    close = Column(DECIMAL)
    volume = Column(BigInteger)

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    source = Column(String, index=True)
    url = Column(String, unique=True, index=True) # Fast deduplication
    published_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    summary = Column(Text)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True) # Bullish, Bearish, Neutral
    related_tickers = Column(String, nullable=True) # JSON stored as string for generic DB compatibility
    category = Column(String, index=True) # e.g. 'market_news', 'company_news'
