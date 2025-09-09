# 🚀 BadgeSmith API Hub - Generate Suggestions Only

A simplified, focused API management system for badge suggestion generation.

## 📁 Simplified Structure

```
src/
├── app/
│   ├── api/
│   │   └── badge/
│   │       └── generate-suggestions/
│   │           └── route.ts          # POST /api/badge/generate-suggestions
│   ├── actions.ts                    # Server actions
│   └── genai/page.tsx               # Frontend page
├── lib/
│   ├── api/                         # 🎯 CENTRAL API HUB
│   │   ├── client.ts                # Core API client
│   │   ├── endpoints.ts             # Single endpoint definition
│   │   ├── services/
│   │   │   ├── badge.ts             # Generate suggestions function
│   │   │   └── index.ts             # Service exports
│   │   └── index.ts                 # Main API exports
│   ├── types/index.ts               # Minimal type definitions
│   ├── constants/index.ts           # Essential constants
│   ├── validations/index.ts         # Form validation
│   └── utils.ts                     # Utility functions
├── hooks/
│   └── use-api.ts                   # Single React hook for generation
└── components/                      # UI components
```

## 🎯 Single API Endpoint

| Method | Endpoint                          | Description                | Request Body          | Response                |
| ------ | --------------------------------- | -------------------------- | --------------------- | ----------------------- |
| `POST` | `/api/badge/generate-suggestions` | Generate badge suggestions | `{ content: string }` | `BadgeGenerationResult` |

## 🔧 Service Function

```typescript
import { generateSuggestions } from "@/lib/api";

// Generate badge suggestions
const result = await generateSuggestions({
  content:
    "This course covers JavaScript fundamentals including variables, functions, and control structures.",
});

if (result.success) {
  console.log("Generated suggestions:", result.data);
  // result.data contains: { title, description, criteria, image }
} else {
  console.error("Error:", result.error);
}
```

## 🎣 React Hook Usage

```typescript
import { useBadgeGeneration } from "@/hooks/use-api";

function BadgeGenerator() {
  const { data, loading, error, execute } = useBadgeGeneration();

  const handleGenerate = async () => {
    const content = "Course content here...";
    const result = await execute(content);

    if (result) {
      console.log("Generated badge:", result);
      // Use result.title, result.description, result.criteria, result.image
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Badge"}
      </button>

      {error && <p className="error">{error}</p>}

      {data && (
        <div>
          <h3>{data.title}</h3>
          <p>{data.description}</p>
          <p>
            <strong>Criteria:</strong> {data.criteria}
          </p>
          {data.image && <img src={data.image} alt="Badge" />}
        </div>
      )}
    </div>
  );
}
```

## 📝 Complete Component Example

```typescript
"use client";

import { useState } from "react";
import { useBadgeGeneration } from "@/hooks/use-api";
import { badgeFormSchema } from "@/lib/validations";

export default function BadgeGeneratorForm() {
  const [content, setContent] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    criteria: "",
    image: "",
  });

  const { data, loading, error, execute } = useBadgeGeneration();

  const handleGenerate = async () => {
    // Validate content
    const validation = badgeFormSchema.shape.content.safeParse(content);
    if (!validation.success) {
      alert(validation.error.issues[0].message);
      return;
    }

    // Generate suggestions
    const result = await execute(content);

    if (result) {
      setFormData({
        title: result.title || "",
        description: result.description || "",
        criteria: result.criteria || "",
        image: result.image || "",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission with formData
    console.log("Submitting badge:", formData);
  };

  return (
    <div className="badge-generator">
      <h1>Badge Generator</h1>

      {/* Content Input */}
      <div className="content-section">
        <label>Course Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter course content (minimum 50 characters)..."
          rows={6}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || content.length < 50}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Badge Suggestions"}
        </button>
      </div>

      {error && (
        <div className="error mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Generated Form */}
      {data && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label>Criteria:</label>
            <textarea
              value={formData.criteria}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, criteria: e.target.value }))
              }
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label>Image URL:</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Badge
          </button>
        </form>
      )}
    </div>
  );
}
```

## 🔄 API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": {
    "title": "JavaScript Fundamentals Badge",
    "description": "This badge recognizes mastery of JavaScript basics",
    "criteria": "Complete all JavaScript exercises and pass assessment",
    "image": "https://via.placeholder.com/200x200/008080/FFFFFF?text=JS"
  }
}

// Error Response
{
  "success": false,
  "error": "Content must be at least 50 characters long"
}
```

## 🚀 Key Features

✅ **Simple & Focused**: Only one API endpoint for badge generation  
✅ **Type Safe**: Full TypeScript support  
✅ **Easy to Use**: Single React hook with loading states  
✅ **Validated**: Input validation with Zod schemas  
✅ **Error Handling**: Consistent error responses  
✅ **Production Ready**: Proper error handling and validation

## 🔧 How to Integrate with Real API

Replace the mock data in `src/app/api/badge/generate-suggestions/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    // Validate input
    if (!content || content.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Content must be at least 50 characters long",
        },
        { status: 400 }
      );
    }

    // Call your actual REST API
    const response = await fetch("https://your-api.com/generate-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
```

Your simplified API hub is ready! 🎉
