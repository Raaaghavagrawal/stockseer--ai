"""Unit tests for the health check routes in app.py.

Uses FastAPI's TestClient to verify:
1. GET /health returns 200 and JSON with status == "ok".
2. HEAD /health returns 200.
3. Cache-Control header is set to "no-store".
4. GET / returns 200 and status == "ok".
5. HEAD / returns 200.
6. GET /health/deep tests database connectivity.
"""
import sys
import os
import unittest

# Allow importing app and modules directly from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


class TestHealthCheck(unittest.TestCase):
    def test_get_health_status_code_200(self):
        """GET /health must return 200 OK."""
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)

    def test_get_health_payload(self):
        """GET /health JSON must contain status == 'ok', service, and timestamp."""
        response = client.get("/health")
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "stockseer-backend")
        self.assertIn("timestamp", data)

    def test_get_health_cache_control_header(self):
        """GET /health must include Cache-Control: no-store."""
        response = client.get("/health")
        self.assertEqual(response.headers.get("cache-control"), "no-store")

    def test_head_health_returns_200(self):
        """HEAD /health must return 200 OK for uptime pingers that use HEAD."""
        response = client.head("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("cache-control"), "no-store")

    def test_get_root_returns_200(self):
        """GET / must return 200 OK with standard health payload."""
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(response.headers.get("cache-control"), "no-store")

    def test_head_root_returns_200(self):
        """HEAD / must return 200 OK."""
        response = client.head("/")
        self.assertEqual(response.status_code, 200)

    def test_get_health_deep(self):
        """GET /health/deep verifies DB check responds with 200 or 503."""
        response = client.get("/health/deep")
        self.assertIn(response.status_code, (200, 503))
        self.assertEqual(response.headers.get("cache-control"), "no-store")


if __name__ == "__main__":
    unittest.main()
