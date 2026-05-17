@echo off
REM Start local dev services for apps-template.
REM Each service opens in its own cmd window so logs stay visible.
REM Close a window (or Ctrl+C inside it) to stop that service.

setlocal
set "ROOT=%~dp0..\.."
pushd "%ROOT%" && set "ROOT=%CD%" && popd

echo.
echo Starting local dev from: %ROOT%
echo.

REM --- shell-api (FastAPI on :8000) ---
start "apps-template / shell-api" cmd /k "cd /d %ROOT%\apps\shell-api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM --- shell SPA (Vite on :5173) ---
start "apps-template / shell" cmd /k "cd /d %ROOT% && npm run dev -w apps/shell"

REM --- access-manager SPA (Vite on :5174) ---
start "apps-template / access-manager" cmd /k "cd /d %ROOT% && npm run dev -w apps/access-manager"

echo Services launched in separate windows:
echo   shell-api       http://localhost:8000
echo   shell           http://localhost:5173
echo   access-manager  http://localhost:5174
echo.
echo For the integrated experience (nginx routing /api/*, /apps/*, /):
echo   1. Build the image once:
echo        docker build -f docker/nginx/Dockerfile -t apps-template-nginx .
echo   2. Run it:
echo        docker run --rm -p 8080:80 ^
echo          -e SHELL_HOST=host.docker.internal:5173 ^
echo          -e SHELL_API_HOST=host.docker.internal:8000 ^
echo          -e ACCESS_MANAGER_HOST=host.docker.internal:5174 ^
echo          apps-template-nginx
echo   3. Open http://localhost:8080
echo.
endlocal
