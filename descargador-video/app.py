"""
TikTok No-Watermark Downloader
Servidor Flask que expone endpoints para obtener info y descargar videos
usando la API pública de tikwm.com.

Ejecutar:
    pip install flask flask-cors requests
    python app.py

Abre http://localhost:5000 en el navegador.
"""

import os
import re
import time
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

# ---------- Configuración ----------
BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

TIKWM_API = "https://www.tikwm.com/api/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
CORS(app)


# ---------- Utilidades ----------
def safe_filename(name: str) -> str:
    """Sanitiza un string para usarlo como nombre de archivo."""
    name = re.sub(r"[^\w\s\-_.]", "", name, flags=re.UNICODE)
    name = re.sub(r"\s+", "_", name).strip("._")
    return name[:80] or "tiktok"


def tikwm_fetch(url: str) -> dict:
    """Consulta la API de tikwm y devuelve el objeto 'data'."""
    resp = requests.post(
        TIKWM_API,
        data={"url": url, "hd": 1},
        headers=HEADERS,
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("code") != 0 or not payload.get("data"):
        raise ValueError(payload.get("msg") or "No se pudo obtener info del video")
    return payload["data"]


# ---------- Rutas ----------
@app.route("/")
def index():
    return send_from_directory(str(BASE_DIR), "index.html")


@app.route("/api/info", methods=["POST"])
def api_info():
    body = request.get_json(silent=True) or {}
    url = (body.get("url") or "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Falta la URL"}), 400

    try:
        data = tikwm_fetch(url)
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 502

    music = data.get("music_info") or {}
    music_url = data.get("music") or music.get("play")

    return jsonify({
        "ok": True,
        "id": data.get("id"),
        "author": (data.get("author") or {}).get("nickname")
                  or (data.get("author") or {}).get("unique_id"),
        "title": data.get("title"),
        "cover": data.get("cover") or data.get("origin_cover"),
        "duration": data.get("duration"),
        "play_count": data.get("play_count"),
        "hdplay": data.get("hdplay"),
        "play": data.get("play"),
        "music": music_url,
    })


@app.route("/api/download", methods=["POST"])
def api_download():
    body = request.get_json(silent=True) or {}
    url = (body.get("url") or "").strip()
    quality = (body.get("quality") or "hd").lower()

    if not url:
        return jsonify({"ok": False, "error": "Falta la URL"}), 400
    if quality not in ("hd", "sd", "audio"):
        return jsonify({"ok": False, "error": "Calidad inválida"}), 400

    try:
        data = tikwm_fetch(url)
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 502

    if quality == "hd":
        media_url = data.get("hdplay") or data.get("play")
        ext = "mp4"
    elif quality == "sd":
        media_url = data.get("play")
        ext = "mp4"
    else:  # audio
        media_url = data.get("music") or (data.get("music_info") or {}).get("play")
        ext = "mp3"

    if not media_url:
        return jsonify({"ok": False, "error": "No se encontró el recurso solicitado"}), 404

    # Descarga a archivo temporal
    author = (data.get("author") or {}).get("unique_id") or "tiktok"
    vid = data.get("id") or str(int(time.time()))
    filename = f"{safe_filename(author)}_{safe_filename(vid)}_{quality}.{ext}"
    filepath = DOWNLOADS_DIR / filename

    try:
        with requests.get(media_url, headers=HEADERS, stream=True, timeout=60) as r:
            r.raise_for_status()
            with open(filepath, "wb") as fh:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        fh.write(chunk)
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Descarga fallida: {exc}"}), 502

    mime = "audio/mpeg" if quality == "audio" else "video/mp4"
    return send_file(
        str(filepath),
        as_attachment=True,
        download_name=filename,
        mimetype=mime,
    )


# ---------- Main ----------
if __name__ == "__main__":
    print("TikTok No-WM Downloader en http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
