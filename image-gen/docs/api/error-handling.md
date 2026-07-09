# Error Handling

This document describes error responses and how to handle them.

## Error Response Format

### Validation Errors (422)

Returned when request validation fails (Pydantic validation).

```json
{
  "detail": [
    {
      "loc": ["body", "image_type"],
      "msg": "image_type must be 'text_overlay' or 'icon_based'",
      "type": "value_error"
    }
  ]
}
```

**Fields**:
- `loc`: Location of the error (path to the field)
- `msg`: Human-readable error message
- `type`: Error type identifier

### Bad Request (400)

Returned for business logic errors.

```json
{
  "detail": "short_title is required for text_overlay type"
}
```

### Internal Server Error (500)

Returned for unexpected server errors.

```json
{
  "detail": "Failed to generate badge: Font file not found"
}
```

---

## Common Errors

### Validation Errors

#### Invalid image_type

**Request**:
```json
{
  "image_type": "invalid_type",
  "short_title": "Test"
}
```

**Response** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "image_type"],
      "msg": "image_type must be 'text_overlay' or 'icon_based'",
      "type": "value_error"
    }
  ]
}
```

#### Invalid scale_factor

**Request**:
```json
{
  "layers": [],
  "scale_factor": 5.0
}
```

**Response** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "scale_factor"],
      "msg": "scale_factor must be between 1.0 and 3.0",
      "type": "value_error"
    }
  ]
}
```

#### Missing Required Fields

**Request** (text_overlay without short_title):
```json
{
  "image_type": "text_overlay",
  "image_configuration": {}
}
```

**Response** (400):
```json
{
  "detail": "short_title is required for text_overlay type"
}
```

**Request** (icon_based without badge_name):
```json
{
  "image_type": "icon_based",
  "image_configuration": {}
}
```

**Response** (400):
```json
{
  "detail": "badge_name and badge_description are required for icon_based type"
}
```

### Configuration Errors

#### Unknown Layer Type

**Request**:
```json
{
  "layers": [
    {
      "type": "UnknownLayer",
      "z": 10
    }
  ]
}
```

**Response** (400):
```json
{
  "detail": "Unknown layer type: UnknownLayer"
}
```

#### Invalid JSON in Config (multipart)

**Request** (generate-with-logo):
```
config: "not valid json"
```

**Response** (400):
```json
{
  "detail": "Invalid JSON in config: Expecting value: line 1 column 1"
}
```

#### Missing Layers Field

**Request**:
```json
{}
```

**Response** (400):
```json
{
  "detail": "Config must contain 'layers' field"
}
```

### Asset Errors

#### Font Not Found

**Request** (invalid font path):
```json
{
  "layers": [
    {
      "type": "TextLayer",
      "text": "Test",
      "font": {"path": "nonexistent.ttf", "size": 40},
      "z": 30
    }
  ]
}
```

**Response** (500):
```json
{
  "detail": "Failed to generate badge: cannot open resource"
}
```

#### Logo File Not Found

**Request** (invalid logo path):
```json
{
  "layers": [
    {
      "type": "LogoLayer",
      "path": "nonexistent.png",
      "z": 20
    }
  ]
}
```

**Response** (500):
```json
{
  "detail": "Failed to generate badge: [Errno 2] No such file or directory"
}
```

### Base64 Errors

#### Invalid Base64 Logo

**Request** (malformed base64 in logo):
```json
{
  "image_type": "text_overlay",
  "short_title": "Test",
  "image_configuration": {
    "logo": "not-valid-base64!!!"
  }
}
```

**Note**: Invalid base64 falls back to default logo with a warning. Check server logs for details.

---

## Error Handling Best Practices

### JavaScript/TypeScript

```typescript
async function generateBadge(config: BadgeRequest): Promise<BadgeResponse> {
  const response = await fetch('/api/v1/badge/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 422) {
      // Validation error
      const messages = error.detail.map(d => `${d.loc.join('.')}: ${d.msg}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }

    if (response.status === 400) {
      // Business logic error
      throw new Error(error.detail);
    }

    // Server error
    throw new Error(error.detail || 'Unknown error');
  }

  return response.json();
}
```

### Python

```python
import requests

def generate_badge(config: dict) -> dict:
    response = requests.post(
        'http://localhost:3001/api/v1/badge/generate',
        json=config
    )

    if response.status_code == 422:
        # Validation error
        errors = response.json()['detail']
        messages = [f"{'.'.join(e['loc'])}: {e['msg']}" for e in errors]
        raise ValueError(f"Validation failed: {', '.join(messages)}")

    if response.status_code == 400:
        # Business logic error
        raise ValueError(response.json()['detail'])

    if response.status_code >= 500:
        # Server error
        raise RuntimeError(response.json().get('detail', 'Server error'))

    response.raise_for_status()
    return response.json()
```

---

## Debugging Tips

### 1. Check Server Logs

The server logs detailed error information:

```bash
# View logs
tail -f logs/badge_service.log
```

### 2. Use Swagger UI

Test endpoints interactively at:
```
http://localhost:3001/badge-image/docs
```

### 3. Validate JSON

Ensure your JSON is valid before sending:

```bash
echo '{"image_type": "text_overlay"}' | python -m json.tool
```

### 4. Check Asset Paths

Verify asset files exist:

```bash
ls assets/fonts/
ls assets/icons/
ls assets/logos/
```

### 5. Test with Minimal Config

Start with a minimal working configuration:

```json
{
  "layers": [
    {
      "type": "ShapeLayer",
      "shape": "circle",
      "fill": {"mode": "solid", "color": "#4B8BBE"},
      "params": {"radius": 200},
      "z": 10
    }
  ]
}
```

---

## HTTP Status Code Reference

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters, missing required fields |
| 422 | Unprocessable Entity | Validation failed (Pydantic) |
| 500 | Internal Server Error | Server-side error, asset not found |
