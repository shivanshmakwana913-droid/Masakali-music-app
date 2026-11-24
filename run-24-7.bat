@echo off
title Masakali 24/7 Server
cd /d "%~dp0"

echo [Masakali] Ensuring production frontend is built...
if not exist "dist\index.html" (
    call npm run build
)

echo [Masakali] Starting unified server on port 5000...
cd server
node index.js
pause
