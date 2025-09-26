"""
Model definitions: simple time-series head + transformer-based sentiment head,
ensembled to produce signal, confidence, and risk level.
This is a lightweight reference implementation; replace with your production models.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np
import torch
import torch.nn as nn


class SimplePriceHead(nn.Module):
    """
    A minimal MLP over last-N engineered features to produce a bullish prob.
    """
    def __init__(self, input_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(),
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 1), nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


@dataclass
class EnsembleConfig:
    price_input_dim: int


class EnsembleModel(nn.Module):
    """
    Ensemble that combines price-head probability with a sentiment prior.
    """
    def __init__(self, cfg: EnsembleConfig):
        super().__init__()
        self.price_head = SimplePriceHead(cfg.price_input_dim)

    def forward(self, price_feats: torch.Tensor, sentiment_score: torch.Tensor) -> Dict[str, torch.Tensor]:
        p_price = self.price_head(price_feats)
        p_sent = (sentiment_score + 1.0) / 2.0
        p_bull = torch.clamp(0.5 * p_price + 0.5 * p_sent, 0.0, 1.0)
        return {"p_bull": p_bull}


def compute_risk_level(sharpe: float, max_drawdown: float) -> str:
    # Heuristic mapping for demo
    if sharpe >= 1.0 and max_drawdown > -0.2:
        return "Low"
    if sharpe >= 0.5 and max_drawdown > -0.35:
        return "Medium"
    return "High"


