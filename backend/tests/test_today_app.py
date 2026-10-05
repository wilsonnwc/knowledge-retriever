"""B4: the hosted app exposes only the Today page + login, and reports mode 'today'."""

import importlib

import pytest


@pytest.fixture
def hosted(monkeypatch, tmp_path):
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setenv("APP_PASSWORD", "pw")
    monkeypatch.setenv("SECRET_KEY", "s")
    (tmp_path / "index.html").write_text("<html>today</html>")
    import today_app
    importlib.reload(today_app)
    monkeypatch.setattr(today_app, "BUILD", tmp_path)
    return today_app.app.test_client()


def test_health_reports_today_mode_without_login(hosted):
    assert hosted.get("/api/health").get_json()["mode"] == "today"


def test_api_needs_login_and_notes_api_does_not_exist(hosted):
    assert hosted.get("/api/today").status_code == 401
    assert hosted.get("/api/notes").status_code in (401, 404)
    hosted.post("/api/login", json={"password": "pw"})
    assert hosted.get("/api/notes").status_code == 404


def test_cookie_is_secure_when_hosted(hosted):
    cookie = hosted.post("/api/login", json={"password": "pw"}).headers["Set-Cookie"]
    assert "Secure" in cookie and "HttpOnly" in cookie


def test_page_routes_serve_the_react_app(hosted):
    assert b"today" in hosted.get("/").data
    assert b"today" in hosted.get("/some/client/route").data


def test_refuses_to_start_hosted_without_a_password(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.delenv("APP_PASSWORD", raising=False)
    import today_app
    with pytest.raises(RuntimeError):
        importlib.reload(today_app)
