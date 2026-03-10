import os
import redis.asyncio as redis
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

async def get_cached_val(key: str):
    data = await redis_client.get(key)
    if data:
        return json.loads(data)
    return None

async def set_cached_val(key: str, data: dict, ttl_seconds: int = 300):
    await redis_client.setex(key, ttl_seconds, json.dumps(data))
