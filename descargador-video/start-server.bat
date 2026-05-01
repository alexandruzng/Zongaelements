@echo off
REM ============================================
REM  TikTok Downloader — arranque del servidor
REM  Este script inicia Flask en http://localhost:5000
REM  y comprueba/instala dependencias si faltan.
REM ============================================

title TikTok Downloader - Server
cd /d "%~dp0"

echo.
echo ============================================
echo   TikTok No WM - Servidor local
echo ============================================
echo.

REM --- Verificar que Python exista ---
where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python no esta instalado o no esta en el PATH.
  echo Descargalo desde https://python.org y marca "Add to PATH".
  pause
  exit /b 1
)

REM --- Instalar dependencias si faltan (silencioso si ya estan) ---
python -c "import flask, flask_cors, requests" >nul 2>&1
if errorlevel 1 (
  echo Instalando dependencias...
  python -m pip install --quiet flask flask-cors requests
  if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)

echo Servidor corriendo en http://localhost:5000
echo Cierra esta ventana para detener el servidor.
echo.

python app.py
