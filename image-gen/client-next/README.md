# Badge Generator Client (Next.js)

A real-time badge editor built with Next.js 14, TypeScript, and Tailwind CSS that provides an interactive interface for creating custom badges with various shapes, colors, text, and images.

## Features

- 🎨 **Real-time Preview** - See badge changes instantly as you edit
- 🎯 **Layer-based Editing** - Manage multiple layers (background, shapes, text, images)
- 🎨 **Gradient Support** - Create beautiful gradients for shapes and backgrounds
- 📝 **Text Customization** - Adjust text size, color, and alignment
- 🖼️ **Image Layers** - Add logos and icons to your badges
- 🔄 **Debounced Updates** - Optimized API calls with 500ms debounce
- 🎭 **TypeScript Support** - Type-safe development experience
- 🎨 **Tailwind CSS** - Utility-first CSS framework for responsive design

## Architecture

```
client-next/
├── app/                   # Next.js app directory
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles with Tailwind directives
├── components/           # React components
│   ├── BadgeEditor.tsx   # Main editor component
│   ├── DynamicForm.tsx   # Form for canvas settings
│   └── LayerEditor.tsx   # Layer-specific controls
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   └── hooks/           # Custom React hooks
│       └── useDebounce.ts
├── types/               # TypeScript definitions
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration for Tailwind
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 3001 (see parent README)
- Python Gradio service running on port 7870

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# The app will be available at http://localhost:3000
```

### Available Scripts

```bash
npm run dev        # Start development server on port 3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run type-check # Check TypeScript types
```

## Usage

Navigate to `http://localhost:3000` and provide a badge configuration via URL parameters:

```javascript
const config = {
  canvas: { width: 600, height: 600 },
  layers: [
    { type: "BackgroundLayer", mode: "solid", color: "#FFFFFF", z: 0 },
    { type: "ShapeLayer", shape: "hexagon", fill: { mode: "gradient", start_color: "#FFD700", end_color: "#FF4500" }, z: 10 }
  ]
};

const url = `http://localhost:3000?config=${encodeURIComponent(JSON.stringify(config))}`;
```

## Layer Types

### BackgroundLayer
```typescript
{
  type: "BackgroundLayer",
  mode: "solid" | "gradient",
  color: "#FFFFFF",
  z: 0
}
```

### ShapeLayer
```typescript
{
  type: "ShapeLayer",
  shape: "hexagon" | "circle" | "rounded_rect",
  fill: {
    mode: "solid" | "gradient",
    color?: "#000000",           // for solid fill
    start_color?: "#FFD700",     // for gradient
    end_color?: "#FF4500",       // for gradient
    vertical?: true
  },
  border?: {
    color: "#800000",
    width: 6
  },
  params?: {
    radius: 250
  },
  z: 10
}
```

### TextLayer
```typescript
{
  type: "TextLayer",
  text: "Your Text",
  font: {
    path: "/path/to/font.ttf",
    size: 45
  },
  color: "#000000",
  align?: {
    x: "left" | "center" | "right" | "dynamic",
    y: "top" | "center" | "bottom" | "dynamic"
  },
  z: 20
}
```

### ImageLayer/LogoLayer
```typescript
{
  type: "ImageLayer" | "LogoLayer",
  path: "../assets/icons/logo.png",
  size: number | { dynamic: true, max_width?: 280 },
  position?: { x: "center", y: "center" },
  y?: number,
  opacity?: 0.8,
  z: 30
}
```


## Development

### TypeScript

The project uses TypeScript with minimal type definitions for simplicity:

```bash
# Check types
npm run type-check

# Types are defined using 'any' for complex objects to keep it simple
```

### Styling

- **Tailwind CSS** - Utility-first CSS framework (v3.4.17)
- Global styles in `app/globals.css` with Tailwind directives
- Responsive utility classes for layout and design
- No custom CSS files - all styling done with Tailwind utilities

### Performance Optimizations

1. **Debounced Updates**: 500ms delay before API calls
2. **Base64 Images**: Direct display without additional HTTP requests
3. **Controlled Components**: Proper handling of form inputs

## API Integration

The client communicates with the Node.js backend API:

```typescript
// lib/api.ts
const API_BASE_URL = 'http://localhost:3001';

export const generateBadge = async (config: any) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/badge/generate`, 
    config
  );
  return response.data; // Returns base64 image
};
```

## Troubleshooting

### Common Issues

1. **"Cannot use JSX unless '--jsx' flag is provided"**
   - This is an IDE issue, not a real error
   - Restart VS Code or reload the window
   - Run "TypeScript: Restart TS Server" in VS Code

2. **Tailwind CSS classes not applying**
   - Ensure you have the correct Tailwind CSS version (v3.4.17)
   - Clear Next.js cache: `rm -rf .next`
   - Restart the development server
   - Check that `postcss.config.js` has the correct configuration

3. **API Connection Failed**
   - Ensure Node.js backend is running on port 3001
   - Check that Python Gradio service is running on port 7870
   - Verify CORS settings if running from different domain

4. **Controlled Component Warnings**
   - All inputs have default values to prevent React warnings
   - Empty strings are handled properly for number inputs

## Future Enhancements

- [ ] Layer reordering with drag-and-drop
- [ ] Template presets for quick start
- [ ] Export options (PNG, SVG, WebP)
- [ ] Undo/redo functionality
- [ ] WebSocket for real-time collaboration
- [ ] Dark mode support with Tailwind CSS
- [ ] Mobile responsive design improvements
- [ ] Keyboard shortcuts
- [ ] Custom Tailwind component utilities

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the MIT Badge Image Generation system.