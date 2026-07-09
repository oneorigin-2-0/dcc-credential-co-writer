# Contributing Guidelines

Thank you for your interest in contributing to the Badge Image Generation project!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up the development environment (see [Setup Guide](./setup.md))
4. Create a feature branch

```bash
git checkout -b feature/your-feature-name
```

## Development Process

### 1. Understand the Codebase

Before making changes, familiarize yourself with:

- [Architecture Overview](../architecture/README.md)
- [Layer System](../architecture/layer-system.md)
- [API Reference](../api/README.md)

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

- Test in Gradio interface
- Test via API endpoints
- Verify all existing tests still pass

### 4. Submit a Pull Request

- Write a clear PR description
- Reference any related issues
- Ensure CI checks pass

## Code Style

### Python Conventions

Follow PEP 8 with these additions:

```python
# Use type hints
def generate_badge(config: Dict[str, Any]) -> BadgeResponse:
    pass

# Add docstrings to public functions
def calculate_bounds(shape: str, params: dict) -> dict:
    """
    Calculate shape bounds.

    Args:
        shape: Shape type (hexagon, circle, etc.)
        params: Shape-specific parameters

    Returns:
        Dictionary with top, bottom, center coordinates
    """
    pass

# Use meaningful variable names
shape_radius = params.get("radius", 250)  # Good
r = params.get("radius", 250)  # Avoid unless obvious
```

### Import Order

```python
# 1. Standard library
import json
import base64
from typing import Dict, Any

# 2. Third-party
from fastapi import APIRouter
from PIL import Image
import numpy as np

# 3. Local
from app.core.layers import LAYER_REGISTRY
from app.models.requests import BadgeRequest
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions | snake_case | `generate_badge()` |
| Classes | PascalCase | `ShapeLayer` |
| Constants | UPPER_SNAKE | `GRADIENT_SCHEMES` |
| Variables | snake_case | `layer_config` |
| Private | _prefix | `_calculate_bounds()` |

## Commit Messages

Use clear, descriptive commit messages:

```
Add ribbon_folded shape with 3D depth effect

- Implement _render_ribbon_folded method in ShapeLayer
- Add fold_darken parameter for customizable depth
- Update documentation with new shape examples
```

### Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

## Pull Request Process

### Before Submitting

- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated (if applicable)
- [ ] No merge conflicts

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Related Issues
Fixes #123
```

### Review Process

1. Submit PR
2. Automated checks run
3. Maintainer reviews
4. Address feedback
5. Approval and merge

## Adding New Features

### New Layer Type

1. Create layer class in `app/core/layers/`
2. Register in `LAYER_REGISTRY`
3. Add tests
4. Document in [Layer System](../architecture/layer-system.md)

### New Shape

1. Add mask generation in `ShapeLayer._mask()`
2. Add border rendering in `ShapeLayer.render()`
3. Add to [Layer System](../architecture/layer-system.md) documentation

### New API Endpoint

1. Add route in `app/controllers/`
2. Add request/response models
3. Document in [API Endpoints](../api/endpoints.md)

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Python version)
- Error messages/logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative solutions considered

## Questions?

- Check existing documentation
- Search closed issues
- Open a discussion

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing!
