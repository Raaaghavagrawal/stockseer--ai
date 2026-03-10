import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, BigInteger, DECIMAL, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    subscription_tier = Column(String(50), default="free")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    portfolios = relationship("Portfolio", back_populates="user")

class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="portfolios")

class AISignal(Base):
    __tablename__ = "ai_signals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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
