@echo off
echo =============================================
echo  AnythingLLM Duplicate File Guard
echo  Port: 3002
echo =============================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python not found!
    echo.
    echo Install Python 3.11+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    exit /b 1
)

:: Copy .env from example if missing
if not exist .env (
    copy .env.example .env >nul
    echo [!] Created .env — open it and set your ANYTHINGLLM_API_KEY!
    echo.
    notepad .env
    pause
)

:: Create venv if missing
if not exist venv (
    echo [*] Creating Python virtual environment...
    python -m venv venv
)

:: Activate and install deps
echo [*] Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo.
echo [*] Starting guard on http://localhost:3002
echo [*] Docs: http://localhost:3002/docs
echo [*] Health: http://localhost:3002/health
echo.

python main.py
