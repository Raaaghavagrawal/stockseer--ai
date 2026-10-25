"""Start the local Stockseer FastAPI backend."""

import os

import uvicorn


if __name__ == "__main__":
    is_deployed = "PORT" in os.environ
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0" if is_deployed else "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false" if is_deployed else "true").lower() == "true",
    )
