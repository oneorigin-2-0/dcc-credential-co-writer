# Developer Guide

Welcome to the Badge Image Generation developer documentation. This guide covers everything you need to know to develop, test, and deploy the service.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd mit-badge-image-generation
pip install -r requirements.txt

# Run the API server
python -m app.main

# In another terminal, test the API
curl http://localhost:3001/badge-image/health
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Setup](./setup.md) | Environment setup and installation |
| [Development Workflow](./development-workflow.md) | Local development and testing |
| [Testing](./testing.md) | Testing strategies and examples |
| [Deployment](./deployment.md) | Docker and production deployment |
| [Contributing](./contributing.md) | Contribution guidelines |

## Services

| Service | Port | Command | Purpose |
|---------|------|---------|---------|
| FastAPI | 3001 | `python -m app.main` | Production API |
| Gradio | 7870 | `python gradio_main.py` | Interactive testing UI |

## Project Structure

```
mit-badge-image-generation/
├── app/                    # FastAPI application
│   ├── main.py             # Entry point
│   ├── controllers/        # API routes
│   ├── core/               # Rendering engine
│   ├── services/           # Business logic
│   └── models/             # Pydantic models
├── assets/                 # Static assets
│   ├── icons/              # 41 icons
│   ├── logos/              # 5 logos
│   └── fonts/              # 4 fonts
├── docs/                   # Documentation
├── scripts/                # Deployment scripts
└── requirements.txt        # Dependencies
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| FastAPI | Web framework |
| Pillow (PIL) | Image processing |
| Pydantic | Data validation |
| Uvicorn | ASGI server |
| sentence-transformers | Icon matching |
| Gradio | Testing UI |

## Development Tips

1. **Use Gradio for testing**: The Gradio interface at `http://localhost:7870` provides real-time visual feedback.

2. **Check Swagger docs**: Interactive API documentation at `http://localhost:3001/badge-image/docs`.

3. **Review layer system**: Understanding the [layer architecture](../architecture/layer-system.md) is key to effective development.

4. **Use scale_factor wisely**: Use `1.0` during development for faster rendering, `2.0` for production.

## Getting Help

- [Architecture Documentation](../architecture/README.md)
- [API Reference](../api/README.md)
- [Swagger UI](http://localhost:3001/badge-image/docs)
