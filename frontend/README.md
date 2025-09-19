# DCC Gen AI UI

A modern, AI-powered credential suggestion generator built with Next.js, React, and TypeScript. This application allows users to generate personalized badge suggestions through an intuitive streaming interface.

## 🚀 Features

- **AI-Powered Generation**: Generate credential suggestions using advanced AI models
- **Real-time Streaming**: Watch suggestions generate in real-time with streaming responses
- **Interactive Cards**: Click on generated suggestions to edit and customize
- **File Upload Support**: Attach documents to enhance generation context
- **Responsive Design**: Beautiful UI that works on all devices
- **DCC Brand Guidelines**: Consistent design following DCC brand standards
- **Navigation Guards**: Prevent data loss with smart navigation protection

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **State Management**: React Hooks
- **API Integration**: Fetch API with Server-Sent Events (SSE)
- **File Handling**: Custom file parser
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dcc-genai-ui
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

**Note**: Update the API URL to match your backend service endpoint.

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── genai/             # Main AI generation pages
│   │   ├── page.tsx       # Main generation form
│   │   ├── suggestions/   # Suggestions display page
│   │   ├── editor/        # Badge editor page
│   │   └── results/       # Results display page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── genai/            # AI-specific components
│   │   ├── suggestion-card.tsx
│   │   └── streaming-status.tsx
│   ├── layout/           # Layout components
│   │   └── header.tsx
│   └── ui/               # Base UI components
├── hooks/                # Custom React hooks
│   ├── use-api.ts
│   ├── use-mobile.tsx
│   ├── use-streaming-suggestion-generator.ts
│   └── use-toast.ts
└── lib/                  # Utility libraries
    ├── api.ts            # API client and streaming logic
    ├── constants/        # App constants
    ├── file-parser.ts    # File parsing utilities
    ├── theme/            # Theme configuration
    ├── types/            # TypeScript type definitions
    └── utils.ts          # General utilities
```

## 🔧 Configuration

### API Configuration

The application uses a streaming API for real-time badge generation. Configure the API endpoint in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://your-api-server.com/api/v1
```

### Brand Configuration

DCC brand colors and typography are configured in `src/lib/constants/brand.ts`:

```typescript
export const DCC_BRAND = {
  colors: {
    creamyYellow: '#DDD78D',
    calmTeal: '#429EA6',
    deepBlue: '#234467',
    regalPurple: '#8B5A96',
    darkGrey: '#40464c',
    lightGrey: '#626a73'
  },
  fonts: {
    headline: 'Roboto Serif',
    body: 'Roboto',
    subhead: 'Roboto',
    mono: 'Roboto Mono'
  }
};
```

## 🎨 UI Components

### Core Components

- **SuggestionCard**: Displays individual badge suggestions with streaming content
- **StreamingStatus**: Shows overall generation progress
- **Header**: Navigation header component

### Custom Hooks

- **useStreamingSuggestionGenerator**: Manages streaming badge generation
- **useApi**: Generic API hook for HTTP requests
- **useToast**: Toast notification management

## 🔄 API Integration

### Streaming API

The application uses Server-Sent Events (SSE) for real-time streaming:

```typescript
// API Response Format
{
  "type": "token",
  "content": "```",
  "accumulated": "```",
  "done": false
}
```

### Badge Data Structure

```typescript
interface BadgeSuggestion {
  title: string;
  description: string;
  criteria: string;
  image?: string;
}
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm start
# or
yarn start
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_BASE_URL` is correct
   - Check if the API server is running
   - Ensure CORS is properly configured

2. **Streaming Not Working**
   - Check browser console for errors
   - Verify API supports Server-Sent Events
   - Check network connectivity

3. **File Upload Issues**
   - Ensure file size is within limits
   - Check file format is supported
   - Verify file parsing logic

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
NEXT_PUBLIC_DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with streaming AI generation
- **v1.1.0** - Added file upload support
- **v1.2.0** - Enhanced UI with DCC brand guidelines
- **v1.3.0** - Added navigation guards and error handling

---

**Built with ❤️ for DCC**