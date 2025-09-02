@echo off
echo ============================================================
echo StockSeer.AI - AI-Powered Stock Analysis Platform
echo ============================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Warning: Node.js is not installed or not in PATH
    echo Frontend will not be available
    echo Please install Node.js to run the frontend
    echo.
)

echo Starting StockSeer.AI...
echo.

REM Start the main launcher
python start_stockseer.py

pause
