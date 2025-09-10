import os
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    # Allow app to start; raise detailed error on first request
    GEMINI_API_KEY = "AIzaSyD4YPQBAEvIV-0B_LUxA1zQu_9IAg__E-Q"

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

app = FastAPI(title="StockSeer Chatbot API", version="1.0.0")

# CORS - adjust origins as needed during deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []  # last N messages

class ChatResponse(BaseModel):
    reply: str


def _get_model():
    if genai is None:
        raise HTTPException(status_code=500, detail="google-generativeai not installed. Add to requirements and reinstall.")
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY in environment.")
    genai.configure(api_key=GEMINI_API_KEY)
    # You can swap to gemini-1.5-pro if you have access
    return genai.GenerativeModel("gemini-1.5-flash")


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        model = _get_model()

        # Build the prompt with context
        system_preamble = (
            "You are StockSeer AI, a helpful assistant for a stock analytics platform. "
            "Be concise, accurate, and friendly. If asked for financial advice, include a disclaimer."
        )

        # Convert history to structure expected by Gemini
        # We'll concatenate into a single prompt; Gemini also supports chat sessions, but this is simple.
        history_text = "\n\n".join([
            ("User: " + m.content) if m.role == "user" else ("Assistant: " + m.content)
            for m in req.history[-12:]
        ])

        prompt = f"""{system_preamble}

{history_text}

User: {req.message}
Assistant:"""

        result = model.generate_content(prompt)
        text = (result.text or "") if hasattr(result, "text") else ""
        if not text:
            text = "I'm sorry, I couldn't generate a response right now. Please try again."
        return ChatResponse(reply=text.strip())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


# Run: uvicorn chatbot_api:app --host 0.0.0.0 --port 8010 --reload
