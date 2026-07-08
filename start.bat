@echo off
setlocal

set "APP_DIR=%~dp0"
set "BACKEND_PORT=8742"
set "FRONTEND_PORT=5742"
set "PID_FILE=%APP_DIR%.backend.pid"
set "LOG_FILE=%APP_DIR%backend.log"

echo ============================
echo  Battle Cats Roll Query Tool
echo ============================
echo.

echo Starting backend (FastAPI) in background...
if exist "%PID_FILE%" del "%PID_FILE%" >nul 2>&1
powershell -NoProfile -Command "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d \"%APP_DIR%backend\" && uvicorn main:app --reload --port %BACKEND_PORT% > \"%LOG_FILE%\" 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File -FilePath \"%PID_FILE%\" -Encoding ascii"

if not exist "%PID_FILE%" (
    echo [Error] Failed to start backend. Check %LOG_FILE% for details.
    pause
    exit /b 1
)
set /p BACKEND_PID=<"%PID_FILE%"
echo Backend started ^(PID %BACKEND_PID%^), logging to backend.log

REM Open the browser a few seconds later, in the background, without blocking this window
start "" /B powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:%FRONTEND_PORT%'"

echo.
echo Starting frontend (Vite)... this window IS the frontend server.
echo Press Ctrl+C here to stop everything (backend will shut down automatically).
echo.

cd /d "%APP_DIR%frontend"
call npm run dev

echo.
echo Frontend stopped. Shutting down backend (PID %BACKEND_PID%)...
taskkill /F /T /PID %BACKEND_PID% >nul 2>&1
del "%PID_FILE%" >nul 2>&1

echo Done.
pause
