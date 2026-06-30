@echo off
title Legends of Iron Local Server
echo ==========================================================
echo        LEGENDS OF IRON - LOCAL GAME SERVER STARTING       
echo ==========================================================
echo.

set "URL=http://localhost:8000"

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Python HTTP Server on port 8000...
    call :launch
    python -m http.server 8000
    goto end
)

:: Check if Node/npx is installed
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting npx http-server on port 8000...
    call :launch
    npx http-server -p 8000
    goto end
)

:: PowerShell Fallback (uses .NET HttpListener)
echo [WARNING] Python or Node not found. Starting PowerShell HTTP server on port 8000...
call :launch
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0serve.ps1'"

:end
echo.
pause
exit /b

:launch
echo Launching Google Chrome...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%URL%"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "%URL%"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%URL%"
) else (
    start "" "%URL%"
)
goto :eof
