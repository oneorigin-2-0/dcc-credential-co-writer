#!/bin/bash
# Production startup script for Badge Image Generator API
# This script handles:
# 1. Environment setup and validation
# 2. Docker image building and container startup
# 3. Health checks and validation
# 4. Service monitoring

set -e

echo "🚀 Starting Badge Image Generator API in Production Mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if required files exist
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found. Please run from project root."
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run from project root."
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please review .env file and update settings if needed."
    else
        echo "⚠️  Warning: No .env file found. Using default settings."
    fi
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
docker-compose build --no-cache

# Start services
echo "📦 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check API health
echo "🔍 Checking API health..."
API_PORT=${PORT:-3001}
for i in {1..30}; do
    if curl -f http://localhost:${API_PORT}/api/v1/health > /dev/null 2>&1; then
        echo "✅ API is healthy"

        # Get and display health status
        HEALTH_STATUS=$(curl -s http://localhost:${API_PORT}/api/v1/health)
        echo "📊 Health Status: ${HEALTH_STATUS}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API failed to start properly"
        echo "📝 Checking logs..."
        docker-compose logs --tail=50 badge-api
        exit 1
    fi
    echo "⏳ Waiting for API... ($i/30)"
    sleep 2
done

# Test badge generation endpoint
echo "🧪 Testing badge generation endpoint..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:${API_PORT}/api/v1/badge/generate \
    -H "Content-Type: application/json" \
    -d '{
        "canvas": {"width": 600, "height": 600},
        "layers": [
            {
                "type": "BackgroundLayer",
                "mode": "solid",
                "color": "#FFFFFF",
                "z": 0
            }
        ]
    }' | head -c 100)

if [[ $TEST_RESPONSE == *"success"* ]]; then
    echo "✅ Badge generation endpoint is working"
else
    echo "⚠️  Badge generation test returned unexpected response"
fi

echo ""
echo "🎉 Badge Image Generator API is running in production mode!"
echo "======================================================="
echo "📊 API Health: http://localhost:${API_PORT}/api/v1/health"
echo "📚 API Docs: http://localhost:${API_PORT}/docs"
echo "🔧 Swagger UI: http://localhost:${API_PORT}/redoc"
echo "📝 Logs: tail -f logs/badge_api.log"
echo ""
echo "📋 Service Information:"
echo "   - API Port: ${API_PORT}"
echo "   - Container: badge-image-generator-api"
echo "   - Service: badge-api"
echo "   - Image: mit-badge-image-generation-badge-api:latest"
echo "   - Canvas Size: 600x600 (fixed)"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📜 To view logs: docker-compose logs -f badge-api"
echo "🔄 To restart: ./scripts/start.sh"