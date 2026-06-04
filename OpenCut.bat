@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

where bun >nul 2>nul
if errorlevel 1 (
  echo Bun is required to start OpenCut. Please install Bun first: https://bun.sh/docs/installation
  exit /b 1
)

echo Starting OpenCut...
start "" /B cmd /c "bun run dev:web"
timeout /t 5 /nobreak >nul
start "" http://localhost:3000

endlocal