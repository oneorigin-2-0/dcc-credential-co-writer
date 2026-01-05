# Deployment Guide

This guide covers deploying the Badge Image Generation service to production.

## Deployment Options

1. **Docker** - Recommended for most deployments
2. **Direct Python** - For simple setups
3. **Docker Compose** - For local development and staging

## Docker Deployment

### Building the Image

```bash
docker build -t badge-generator:latest .
```

### Running the Container

```bash
docker run -d \
  --name badge-generator \
  -p 3001:3001 \
  -e PORT=3001 \
  badge-generator:latest
```

### With Environment Variables

```bash
docker run -d \
  --name badge-generator \
  -p 3001:3001 \
  -e PORT=3001 \
  -e CORS_ORIGINS_STR="https://yourdomain.com" \
  badge-generator:latest
```

### Docker Compose

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  badge-generator:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CORS_ORIGINS_STR=*
    volumes:
      - ./assets:/app/assets:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/badge-image/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Commands**:

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

## Direct Python Deployment

### Using Scripts

**Linux/macOS**:

```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

**Windows**:

```cmd
scripts\start.bat
```

### Using Uvicorn

**Development**:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```

**Production**:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3001 --workers 4
```

### Using Gunicorn (Linux)

```bash
gunicorn app.main:app \
  --bind 0.0.0.0:3001 \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --timeout 120
```

## Production Configuration

### Environment Variables

| Variable | Production Value | Description |
|----------|-----------------|-------------|
| `PORT` | `3001` | API port |
| `CORS_ORIGINS_STR` | `https://yourdomain.com` | Allowed origins |

### Recommended Settings

```bash
# Number of workers (2-4 x CPU cores)
WORKERS=4

# Timeout for long operations
TIMEOUT=120

# Logging
LOG_LEVEL=info
```

## Reverse Proxy (Nginx)

**nginx.conf**:

```nginx
upstream badge_generator {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name badges.yourdomain.com;

    location / {
        proxy_pass http://badge_generator;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for badge generation
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    # Health check
    location /badge-image/health {
        proxy_pass http://badge_generator;
    }
}
```

### SSL/HTTPS

```nginx
server {
    listen 443 ssl;
    server_name badges.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://badge_generator;
        # ... proxy settings
    }
}

server {
    listen 80;
    server_name badges.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Health Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/badge-image/health
```

Expected response:
```json
{"status": "healthy"}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3001/badge-image/health || exit 1
```

### Monitoring Script

```bash
#!/bin/bash

while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/badge-image/health)
    if [ "$response" != "200" ]; then
        echo "$(date): Service unhealthy - restarting..."
        docker restart badge-generator
    fi
    sleep 60
done
```

## Logging

### Log Location

Logs are stored in the `logs/` directory:

```
logs/
├── badge_service.log
└── access.log
```

### Log Rotation

Add logrotate configuration:

```
/path/to/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

## Scaling

### Horizontal Scaling

Use a load balancer with multiple instances:

```
                 ┌─────────────────┐
                 │  Load Balancer  │
                 └────────┬────────┘
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
   │  :3001      │ │  :3002      │ │  :3003      │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Docker Swarm

```yaml
version: '3.8'

services:
  badge-generator:
    image: badge-generator:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "3001:3001"
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: badge-generator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: badge-generator
  template:
    metadata:
      labels:
        app: badge-generator
    spec:
      containers:
        - name: badge-generator
          image: badge-generator:latest
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
          livenessProbe:
            httpGet:
              path: /badge-image/health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
            requests:
              memory: "256Mi"
              cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: badge-generator-service
spec:
  selector:
    app: badge-generator
  ports:
    - port: 80
      targetPort: 3001
  type: LoadBalancer
```

## Performance Tuning

### Recommended Resources

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| Memory | 512MB | 1GB |
| Storage | 100MB | 500MB |

### Caching

For high-traffic deployments, consider:

1. **Redis caching** for frequently requested configurations
2. **CDN** for serving generated badges
3. **Response caching** for identical requests

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Permission denied for assets**:
   ```bash
   chmod -R 755 assets/
   ```

3. **Memory issues**:
   - Reduce workers
   - Add memory limits
   - Use smaller scale_factor

### Debugging Production

```bash
# View Docker logs
docker logs badge-generator

# Enter container shell
docker exec -it badge-generator /bin/bash

# Check application logs
docker exec badge-generator cat logs/badge_service.log
```
