# Testing Guide

This guide covers testing strategies for the Badge Image Generation service.

## Testing Approaches

### 1. Manual Testing

#### Gradio Interface

Best for visual testing and rapid iteration:

1. Start the Gradio server: `python gradio_main.py`
2. Open `http://localhost:7870`
3. Modify JSON configuration
4. Click "Generate Badge"
5. Verify the output visually

#### Swagger UI

Best for API testing:

1. Start the API server: `python -m app.main`
2. Open `http://localhost:3001/badge-image/docs`
3. Test endpoints interactively

### 2. cURL Testing

Quick command-line testing:

```bash
# Health check
curl http://localhost:3001/badge-image/health

# Generate text badge
curl -X POST http://localhost:3001/api/v1/badge/generate-with-text \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "text_overlay",
    "short_title": "Test",
    "image_configuration": {"shape": "hexagon"}
  }'

# Generate icon badge
curl -X POST http://localhost:3001/api/v1/badge/generate-with-icon \
  -H "Content-Type: application/json" \
  -d '{
    "image_type": "icon_based",
    "badge_name": "Science",
    "badge_description": "Chemistry achievement",
    "image_configuration": {"shape": "circle"}
  }'
```

### 3. Python Test Scripts

Create test scripts for automated testing:

```python
# test_badge_generation.py
import requests
import base64
import os

BASE_URL = "http://localhost:3001"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/badge-image/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("Health check passed")

def test_text_overlay():
    """Test text overlay badge generation"""
    response = requests.post(
        f"{BASE_URL}/api/v1/badge/generate-with-text",
        json={
            "image_type": "text_overlay",
            "short_title": "Python Expert",
            "achievement_phrase": "Master Coder",
            "image_configuration": {
                "primary_color": "#4B8BBE",
                "shape": "hexagon"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["data"]["base64"].startswith("data:image/png;base64,")
    print("Text overlay test passed")

def test_icon_based():
    """Test icon-based badge generation"""
    response = requests.post(
        f"{BASE_URL}/api/v1/badge/generate-with-icon",
        json={
            "image_type": "icon_based",
            "badge_name": "Chemistry Expert",
            "badge_description": "Completed chemistry experiments",
            "image_configuration": {
                "shape": "circle"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    print("Icon-based test passed")

def test_raw_config():
    """Test raw layer configuration"""
    response = requests.post(
        f"{BASE_URL}/api/v1/badge/generate",
        json={
            "layers": [
                {
                    "type": "ShapeLayer",
                    "shape": "hexagon",
                    "fill": {"mode": "solid", "color": "#4B8BBE"},
                    "params": {"radius": 250},
                    "z": 10
                }
            ],
            "scale_factor": 1.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    print("Raw config test passed")

def test_validation_error():
    """Test validation error handling"""
    response = requests.post(
        f"{BASE_URL}/api/v1/badge/generate-with-text",
        json={
            "image_type": "invalid_type",
            "image_configuration": {}
        }
    )
    assert response.status_code == 422
    print("Validation error test passed")

def run_all_tests():
    """Run all tests"""
    test_health()
    test_text_overlay()
    test_icon_based()
    test_raw_config()
    test_validation_error()
    print("\nAll tests passed!")

if __name__ == "__main__":
    run_all_tests()
```

Run the tests:

```bash
python test_badge_generation.py
```

## Test Cases

### Shape Testing

Test all supported shapes:

| Shape | Test Configuration |
|-------|-------------------|
| hexagon | `{"shape": "hexagon", "params": {"radius": 250}}` |
| circle | `{"shape": "circle", "params": {"radius": 250}}` |
| rounded_rect | `{"shape": "rounded_rect", "params": {"width": 450, "height": 450, "radius": 50}}` |
| ribbon | `{"shape": "ribbon", "params": {"width": 480, "height": 80}}` |
| ribbon_folded | `{"shape": "ribbon_folded", "params": {"width": 480, "height": 80}}` |

### Fill Mode Testing

Test solid and gradient fills:

```json
// Solid
{"fill": {"mode": "solid", "color": "#4B8BBE"}}

// Gradient
{"fill": {"mode": "gradient", "start_color": "#4B8BBE", "end_color": "#306998", "vertical": true}}
```

### Text Layer Testing

Test various text configurations:

```json
{
  "type": "TextLayer",
  "text": "Long text that should wrap dynamically within the shape bounds",
  "font": {"path": "assets/fonts/Arial.ttf", "size": 40},
  "color": "#FFFFFF",
  "align": {"x": "center", "y": "dynamic"},
  "wrap": {"dynamic": true, "line_gap": 6}
}
```

### Scale Factor Testing

Test different output sizes:

| Scale Factor | Expected Dimensions |
|--------------|-------------------|
| 1.0 | 600x600 |
| 2.0 | 1200x1200 |
| 3.0 | 1800x1800 |

## Edge Cases

### Empty/Missing Fields

```json
// Missing short_title (should error)
{
  "image_type": "text_overlay",
  "image_configuration": {}
}

// Empty layers (should generate empty badge)
{
  "layers": []
}
```

### Invalid Values

```json
// Invalid scale_factor (should error)
{
  "layers": [],
  "scale_factor": 10.0
}

// Invalid shape (should error)
{
  "layers": [{"type": "ShapeLayer", "shape": "triangle"}]
}
```

### Long Text

Test text wrapping with very long text:

```json
{
  "type": "TextLayer",
  "text": "This is a very long title that should wrap across multiple lines within the shape boundaries",
  "font": {"path": "assets/fonts/Arial.ttf", "size": 45},
  "align": {"x": "center", "y": "dynamic"},
  "wrap": {"dynamic": true}
}
```

## Saving Test Output

Save generated badges for visual inspection:

```python
import requests
import base64

response = requests.post(
    "http://localhost:3001/api/v1/badge/generate-with-text",
    json={
        "image_type": "text_overlay",
        "short_title": "Test Badge",
        "image_configuration": {"shape": "hexagon"}
    }
)

data = response.json()
if data["success"]:
    # Remove data URI prefix and decode
    base64_data = data["data"]["base64"].split(",")[1]
    image_bytes = base64.b64decode(base64_data)

    # Save to file
    with open("test_output.png", "wb") as f:
        f.write(image_bytes)

    print("Saved test_output.png")
```

## Continuous Integration

Example test workflow for CI:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Start server
        run: |
          python -m app.main &
          sleep 5

      - name: Run tests
        run: python test_badge_generation.py
```

## Performance Testing

Test response times:

```python
import requests
import time

def test_performance(n=10):
    """Test average response time"""
    times = []

    for i in range(n):
        start = time.time()
        response = requests.post(
            "http://localhost:3001/api/v1/badge/generate-with-text",
            json={
                "image_type": "text_overlay",
                "short_title": f"Badge {i}",
                "image_configuration": {"shape": "hexagon"}
            }
        )
        elapsed = time.time() - start
        times.append(elapsed)
        print(f"Request {i+1}: {elapsed:.3f}s")

    avg = sum(times) / len(times)
    print(f"\nAverage: {avg:.3f}s")
    print(f"Min: {min(times):.3f}s")
    print(f"Max: {max(times):.3f}s")

if __name__ == "__main__":
    test_performance()
```
