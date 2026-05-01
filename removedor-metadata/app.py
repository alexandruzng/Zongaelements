"""
Removedor de Metadata — Servidor Flask
Extrae y elimina metadata de imágenes, videos y audios usando librerías
puras de Python (sin dependencia de ffmpeg):
  - Pillow + piexif  → imágenes (JPG, PNG, WEBP, TIFF)
  - mutagen          → audio/video MP4, MP3, FLAC, M4A
  - hachoir          → extracción universal de metadata

Ejecutar:
    pip install flask flask-cors mutagen Pillow hachoir
    python app.py

Abre http://localhost:5001
"""

import io
import json
import mimetypes
import os
import shutil
import time
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from PIL import Image

# mutagen para mp4/mp3/flac
from mutagen import File as MutagenFile
from mutagen.mp4 import MP4
from mutagen.mp3 import MP3
from mutagen.id3 import ID3NoHeaderError

# hachoir para extracción universal de metadata
from hachoir.parser import createParser
from hachoir.metadata import extractMetadata

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
CLEANED_DIR = BASE_DIR / "cleaned"
UPLOADS_DIR.mkdir(exist_ok=True)
CLEANED_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_MB = 200

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
CORS(app)


# ---------- Helpers ----------
def human_size(nbytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if nbytes < 1024:
            return f"{nbytes:.2f} {unit}"
        nbytes /= 1024
    return f"{nbytes:.2f} TB"


def extract_metadata(filepath: Path) -> dict:
    """Extrae toda la metadata posible usando hachoir + stat + mime."""
    stat = filepath.stat()
    mime = mimetypes.guess_type(str(filepath))[0] or "application/octet-stream"

    meta = {
        "FileName": filepath.name,
        "FileSize": human_size(stat.st_size),
        "FileType": filepath.suffix.upper().lstrip(".") or "unknown",
        "MIMEType": mime,
        "FileModifyDate": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
        "FileAccessDate": datetime.fromtimestamp(stat.st_atime).strftime("%Y-%m-%d %H:%M:%S"),
        "FileCreateDate": datetime.fromtimestamp(stat.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
        "FilePermissions": oct(stat.st_mode & 0o777),
    }

    # hachoir extrae toda la metadata específica del formato
    try:
        parser = createParser(str(filepath))
        if parser:
            with parser:
                hmeta = extractMetadata(parser)
                if hmeta:
                    for line in hmeta.exportPlaintext():
                        if ":" in line:
                            k, v = line.split(":", 1)
                            k = k.strip().replace(" ", "").replace("-", "")
                            v = v.strip()
                            if k and v and k not in meta:
                                meta[k] = v
    except Exception as exc:
        meta["_hachoirError"] = str(exc)

    # Tags específicos si es imagen (EXIF detallado)
    if mime.startswith("image/"):
        try:
            with Image.open(filepath) as img:
                exif = getattr(img, "_getexif", lambda: None)()
                if exif:
                    from PIL.ExifTags import TAGS
                    for tid, val in exif.items():
                        name = TAGS.get(tid, f"Exif_{tid}")
                        try:
                            meta[f"EXIF_{name}"] = str(val)[:200]
                        except Exception:
                            pass
        except Exception:
            pass

    # Tags específicos si es mp4
    if filepath.suffix.lower() in (".mp4", ".m4a", ".mov"):
        try:
            mp = MP4(str(filepath))
            for k, v in (mp.tags or {}).items():
                meta[f"MP4_{k}"] = str(v)[:200]
        except Exception:
            pass

    return meta


def clean_file(src: Path, dst: Path) -> None:
    """Elimina toda la metadata posible del archivo y escribe en dst."""
    ext = src.suffix.lower()

    # ---- Imágenes ----
    if ext in (".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp", ".gif"):
        with Image.open(src) as img:
            data = list(img.getdata())
            clean = Image.new(img.mode, img.size)
            clean.putdata(data)
            save_kwargs = {}
            if ext in (".jpg", ".jpeg"):
                save_kwargs = {"format": "JPEG", "quality": 95, "subsampling": 0}
            elif ext == ".png":
                save_kwargs = {"format": "PNG"}
            elif ext == ".webp":
                save_kwargs = {"format": "WEBP", "quality": 95}
            clean.save(dst, **save_kwargs)
        return

    # ---- MP4 / M4A / MOV ----
    if ext in (".mp4", ".m4a", ".mov"):
        shutil.copy2(src, dst)
        try:
            mp = MP4(str(dst))
            if mp.tags is not None:
                mp.tags.clear()
            mp.save()
        except Exception:
            pass
        # Quitar también atom udta/meta a nivel crudo si quedan restos
        _strip_mp4_udta(dst)
        _neutralize_timestamps(dst)
        return

    # ---- MP3 ----
    if ext == ".mp3":
        shutil.copy2(src, dst)
        try:
            audio = MP3(str(dst))
            audio.delete()
            audio.save()
        except ID3NoHeaderError:
            pass
        except Exception:
            pass
        _neutralize_timestamps(dst)
        return

    # ---- Otros formatos soportados por mutagen ----
    try:
        shutil.copy2(src, dst)
        mf = MutagenFile(str(dst))
        if mf is not None:
            try:
                mf.delete()
            except Exception:
                pass
            try:
                mf.save()
            except Exception:
                pass
        _neutralize_timestamps(dst)
    except Exception:
        # Fallback: copia simple con timestamps reseteados
        shutil.copy2(src, dst)
        _neutralize_timestamps(dst)


def _neutralize_timestamps(p: Path) -> None:
    """Fija timestamps al epoch para no filtrar fecha de procesamiento."""
    try:
        os.utime(p, (0, 0))
    except Exception:
        pass


def _strip_mp4_udta(p: Path) -> None:
    """Intenta eliminar atoms 'udta' (user data) de un mp4 crudo reescribiéndolo."""
    try:
        data = p.read_bytes()
        # Búsqueda simple del atom udta en el árbol superior
        out = bytearray()
        i = 0
        n = len(data)
        while i + 8 <= n:
            size = int.from_bytes(data[i:i+4], "big")
            atom = data[i+4:i+8]
            if size == 0:
                out += data[i:]
                break
            if size == 1:
                # 64-bit size
                size = int.from_bytes(data[i+8:i+16], "big")
            if size < 8 or i + size > n:
                out += data[i:]
                break
            if atom == b"udta":
                # Saltamos este atom
                i += size
                continue
            out += data[i:i+size]
            i += size
        p.write_bytes(bytes(out))
    except Exception:
        pass


# ---------- Rutas ----------
@app.route("/")
def index():
    return send_from_directory(str(BASE_DIR), "index.html")


@app.route("/api/metadata", methods=["POST"])
def api_metadata():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No se envió archivo"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"ok": False, "error": "Archivo vacío"}), 400

    uid = uuid.uuid4().hex
    # Nombre sanitizado
    safe = "".join(c for c in f.filename if c.isalnum() or c in "._-")[:80] or "upload"
    src = UPLOADS_DIR / f"{uid}_{safe}"
    f.save(src)

    try:
        meta = extract_metadata(src)
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Extracción fallida: {exc}"}), 500

    return jsonify({
        "ok": True,
        "id": uid,
        "originalName": f.filename,
        "storedName": safe,
        "metadata": meta,
    })


@app.route("/api/clean", methods=["POST"])
def api_clean():
    body = request.get_json(silent=True) or {}
    uid = body.get("id", "")
    stored = body.get("storedName", "")
    if not uid or not stored:
        return jsonify({"ok": False, "error": "Faltan parámetros"}), 400

    src = UPLOADS_DIR / f"{uid}_{stored}"
    if not src.exists():
        return jsonify({"ok": False, "error": "Archivo no encontrado"}), 404

    dst = CLEANED_DIR / f"{uid}_clean_{stored}"
    try:
        clean_file(src, dst)
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Limpieza fallida: {exc}"}), 500

    try:
        meta = extract_metadata(dst)
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Re-lectura fallida: {exc}"}), 500

    return jsonify({
        "ok": True,
        "id": uid,
        "storedName": stored,
        "metadata": meta,
    })


@app.route("/api/download/<uid>/<path:name>")
def api_download(uid, name):
    safe = "".join(c for c in name if c.isalnum() or c in "._-")[:80]
    dst = CLEANED_DIR / f"{uid}_clean_{safe}"
    if not dst.exists():
        return jsonify({"ok": False, "error": "No encontrado"}), 404
    return send_file(
        str(dst),
        as_attachment=True,
        download_name=f"clean_{safe}",
    )


# ---------- Main ----------
if __name__ == "__main__":
    print("Removedor de Metadata en http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
