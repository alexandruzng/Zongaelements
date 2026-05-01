import sys
import requests
import os

def download(tiktok_url, quality="hd"):
    print(f"Obteniendo info del video...")
    r = requests.get("https://www.tikwm.com/api/", params={"url": tiktok_url, "hd": 1}, timeout=15)
    d = r.json()

    if d.get("code") != 0:
        print(f"Error: {d.get('msg', 'desconocido')}")
        return

    data = d["data"]
    video_id = data["id"]

    if quality == "hd":
        url = data.get("hdplay") or data.get("play")
        ext = "mp4"
    elif quality == "sd":
        url = data.get("play")
        ext = "mp4"
    elif quality == "audio":
        url = data.get("music")
        ext = "mp3"
    else:
        url = data.get("hdplay") or data.get("play")
        ext = "mp4"

    filename = f"tiktok_{video_id}.{ext}"
    print(f"Descargando {quality.upper()}... ({filename})")

    video = requests.get(url, stream=True, timeout=60)
    total = int(video.headers.get("content-length", 0))
    downloaded = 0

    with open(filename, "wb") as f:
        for chunk in video.iter_content(chunk_size=65536):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = int(downloaded / total * 100)
                    print(f"\r  {pct}% — {downloaded//1048576:.1f} MB / {total//1048576:.1f} MB", end="", flush=True)

    print(f"\nGuardado: {os.path.abspath(filename)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        url = input("Pega el link de TikTok: ").strip()
    else:
        url = sys.argv[1]

    q = sys.argv[2] if len(sys.argv) > 2 else "hd"
    download(url, quality=q)