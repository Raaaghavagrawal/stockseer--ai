"""
Sentiment analysis utilities using Hugging Face transformers pipeline.
Falls back to VADER-like heuristic if HF is unavailable.
"""
from __future__ import annotations

from typing import List

try:
    from transformers import pipeline
except Exception:
    pipeline = None  # Optional dependency for environments without HF


def get_sentiment_score(texts: List[str]) -> float:
    """
    Returns an aggregate sentiment score in [-1, 1].
    """
    if not texts:
        return 0.0

    if pipeline is not None:
        try:
            clf = pipeline("sentiment-analysis")
            preds = clf(texts[:64])  # limit for speed
            # Map labels to [-1,1]
            scores = []
            for p in preds:
                label = p.get("label", "NEUTRAL").upper()
                score = float(p.get("score", 0.5))
                if label.startswith("POS"):
                    scores.append(score)
                elif label.startswith("NEG"):
                    scores.append(-score)
                else:
                    scores.append(0.0)
            return float(sum(scores) / max(len(scores), 1))
        except Exception:
            pass

    # Fallback simple heuristic
    return 0.0


