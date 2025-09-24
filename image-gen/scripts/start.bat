@echo off
REM Production startup script for Badge Image Generator API (Windows)
REM This script handles:
REM 1. Environment setup and validation
REM 2. Docker image building and container startup
REM 3. Health checks and validation
REM 4. Service monitoring

setlocal enabledelayedexpansion

echo 🚀 Starting Badge Image Generator API in Production Mode...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if required files exist
if not exist "Dockerfile" (
    echo ❌ Dockerfile not found. Please run from project root.
    pause
    exit /b 1
)

if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found. Please run from project root.
    pause
    exit /b 1
)

if not exist "requirements.txt" (
    echo ❌ requirements.txt not found.
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Check if .env exists, if not copy from example
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo ⚠️  Please review .env file and update settings if needed.
    ) else (
        echo ⚠️  Warning: No .env file found. Using default settings.
    )
)

REM Clean up any existing containers
echo 🧹 Cleaning up existing containers...
docker-compose down >nul 2>&1

REM Build the Docker image
echo 🔨 Building Docker image...
docker-compose build --no-cache

REM Start services
echo 📦 Starting services...
docker-compose up -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

REM Check API health
echo 🔍 Checking API health...
set API_PORT=3001
if not defined PORT set PORT=3001
set API_PORT=%PORT%

set /a counter=0
:healthcheck_loop
set /a counter+=1
curl -f http://localhost:%API_PORT%/api/v1/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API is healthy

    REM Get and display health status
    for /f "delims=" %%i in ('curl -s http://localhost:%API_PORT%/api/v1/health') do set HEALTH_STATUS=%%i
    echo 📊 Health Status: !HEALTH_STATUS!
    goto :health_success
)

if %counter% geq 30 (
    echo ❌ API failed to start properly
    echo 📝 Checking logs...
    docker-compose logs --tail=50 badge-api
    pause
    exit /b 1
)

echo ⏳ Waiting for API... (%counter%/30)
timeout /t 2 /nobreak >nul
goto :healthcheck_loop

:health_success

REM Test badge generation endpoint
echo 🧪 Testing badge generation endpoint...
for /f "delims=" %%i in ('curl -s -X POST http://localhost:%API_PORT%/api/v1/badge/generate -H "Content-Type: application/json" -d "{\"canvas\": {\"width\": 600, \"height\": 600}, \"layers\": [{\"type\": \"BackgroundLayer\", \"mode\": \"solid\", \"color\": \"#FFFFFF\", \"z\": 0}]}" ^| findstr /c:"success"') do set TEST_RESPONSE=%%i

if defined TEST_RESPONSE (
    echo ✅ Badge generation endpoint is working
) else (
    echo ⚠️  Badge generation test returned unexpected response
)

echo.
echo 🎉 Badge Image Generator API is running in production mode!
echo =======================================================
echo 📊 API Health: http://localhost:%API_PORT%/api/v1/health
echo 📚 API Docs: http://localhost:%API_PORT%/docs
echo 🔧 Swagger UI: http://localhost:%API_PORT%/redoc
echo 📝 Logs: tail -f logs/badge_api.log
echo.
echo 📋 Service Information:
echo    - API Port: %API_PORT%
echo    - Container: badge-image-generator-api
echo    - Service: badge-api
echo    - Image: mit-badge-image-generation-badge-api:latest
echo    - Canvas Size: 600x600 (fixed)
echo.
echo 🛑 To stop: docker-compose down
echo 📜 To view logs: docker-compose logs -f badge-api
echo 🔄 To restart: scripts\start.bat
echo.
pause