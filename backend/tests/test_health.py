"""
Student ERP — Backend Foundation Tests: Health Check Endpoint
Verifies that GET /api/health/ returns HTTP 200, valid JSON envelope, and handles disconnected database gracefully.
"""

from django.test import Client
import pytest


@pytest.fixture
def client():
    return Client()


def test_health_endpoint_returns_200(client):
    """Verify GET /api/health/ returns HTTP 200 without authentication."""
    response = client.get('/api/health/')
    assert response.status_code == 200


def test_health_endpoint_payload_structure(client):
    """Verify health endpoint returns valid JSON with expected metadata fields."""
    response = client.get('/api/health/')
    assert response.status_code == 200
    data = response.json()

    assert data.get('status') == 'ok'
    assert data.get('service') == 'student-erp-backend'
    assert 'environment' in data
    assert 'database' in data
    # Database status must be either 'connected' or 'disconnected' (honest probe)
    assert data['database'] in ['connected', 'disconnected']


def test_health_endpoint_unauthenticated_access(client):
    """Verify that unauthenticated requests are permitted (AllowAny)."""
    # Explicitly do NOT provide any Authorization header or session cookies
    response = client.get('/api/health/')
    assert response.status_code == 200
    assert response['content-type'].startswith('application/json')
