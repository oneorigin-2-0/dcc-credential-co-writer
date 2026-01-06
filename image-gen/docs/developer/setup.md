# Environment Setup

This guide covers how to set up your development environment.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mit-badge-image-generation
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file (optional):

```bash
cp .env.example .env
```

**Available Environment Variables**:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `CORS_ORIGINS_STR` | `*` | CORS allowed origins |

### 5. Verify Installation

```bash
# Start the server
python -m app.main

# In another terminal, test
curl http://localhost:3001/badge-image/health
```

Expected response:
```json
{"status": "healthy"}
```

## Docker Setup

### Using Docker Compose

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker Directly

```bash
# Build image
docker build -t badge-generator .

# Run container
docker run -p 3001:3001 badge-generator
```

## IDE Configuration

### VS Code

Recommended extensions:
- Python (Microsoft)
- Pylance
- Python Docstring Generator

**settings.json**:
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

### PyCharm

1. Open the project folder
2. Set Project Interpreter to the virtual environment
3. Mark `app/` as Sources Root

## Troubleshooting

### Import Errors

If you see import errors, ensure you're running from the project root:

```bash
# Correct
cd mit-badge-image-generation
python -m app.main

# Incorrect
cd mit-badge-image-generation/app
python main.py
```

### Font Issues

The project includes bundled fonts in `assets/fonts/`. If fonts aren't loading:

1. Check the font path in your configuration
2. Verify the file exists: `ls assets/fonts/`

Available fonts:
- `Arial.ttf`
- `ArialBold.ttf`
- `OpenSans.ttf`
- `Roboto.ttf`

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### PIL/Pillow Issues

If you encounter Pillow errors:

```bash
# Reinstall Pillow
pip uninstall Pillow
pip install Pillow
```

## Project Dependencies

Key dependencies from `requirements.txt`:

| Package | Purpose |
|---------|---------|
| fastapi | Web framework |
| uvicorn | ASGI server |
| pillow | Image processing |
| pydantic | Data validation |
| pydantic-settings | Configuration |
| gradio | Testing UI |
| sentence-transformers | Icon matching |
| httpx | HTTP client |

## Next Steps

- [Development Workflow](./development-workflow.md) - Start developing
- [Testing](./testing.md) - Run and write tests
- [Architecture](../architecture/README.md) - Understand the system
