# BadgeSmith - AI-Powered Badge Creator

BadgeSmith is a modern web application built with Next.js that uses AI to generate digital badge suggestions from course content, project summaries, or any educational material. The application creates OpenBadge-compatible credentials with AI-generated titles, descriptions, criteria, and images.

## 🚀 Features

- **AI-Powered Badge Generation**: Generate badge suggestions from text content or uploaded files
- **File Upload Support**: Upload PDF, DOC, and DOCX files for content analysis
- **Modern UI**: Built with Next.js 15, React 18, and Tailwind CSS
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Responsive Design**: Mobile-first design with beautiful animations
- **File Parsing**: Support for multiple file formats with content extraction
- **Real-time Validation**: Form validation with Zod schemas
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1 with custom DCC theme
- **UI Components**: Radix UI primitives with shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **File Processing**: PDF parsing with pdf-parse and mammoth for Word docs
- **Animations**: Lottie React for interactive animations
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Roboto family)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Git**: For version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <https://github.com/oneorigin-inc/mit-badge-front-end.git>
cd dcc-genai-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The application doesn't require environment variables for basic functionality, but you may want to configure:

- **API Endpoints**: Update `src/lib/api/endpoints.ts` for your backend
- **File Upload Limits**: Modify `next.config.ts` if needed
- **External Services**: Add API keys if integrating with external services

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
dcc-genai-ui/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   └── badge/
│   │   │       └── generate-suggestions/
│   │   │           └── route.ts      # Badge generation API
│   │   ├── genai/                    # Main application pages
│   │   │   ├── page.tsx             # Badge generation form
│   │   │   └── results/
│   │   │       └── page.tsx         # Results display
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/                   # React components
│   │   ├── shared/                  # Shared components
│   │   │   └── header.tsx          # Application header
│   │   └── ui/                     # UI component library
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-api.ts             # API integration hook
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts           # Toast notifications hook
│   └── lib/                        # Utility libraries
│       ├── api/                    # API client and services
│       │   ├── client.ts          # HTTP client
│       │   ├── endpoints.ts       # API endpoints
│       │   ├── services/
│       │   │   ├── badge.ts       # Badge generation service
│       │   │   └── index.ts       # Service exports
│       │   └── index.ts           # Main API exports
│       ├── constants/              # Application constants
│       ├── file-parser.ts         # File parsing utilities
│       ├── new-file-parser.ts     # Enhanced file parser
│       ├── theme/                 # Theme configuration
│       │   └── dcc-theme.ts       # DCC brand theme
│       ├── types/                 # TypeScript type definitions
│       ├── validations/           # Form validation schemas
│       └── utils.ts              # Utility functions
├── public/                        # Static assets
├── components.json               # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🎯 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🔧 Configuration

### Next.js Configuration

The application uses Next.js 15 with the following key configurations:

- **Turbopack**: Enabled for faster development builds
- **TypeScript**: Build errors are ignored during development
- **ESLint**: Build errors are ignored during development
- **Image Optimization**: Configured for external image sources

### Tailwind CSS

Custom theme configuration with:
- **DCC Brand Colors**: Custom color palette
- **Typography**: Roboto font family variants
- **Animations**: Custom keyframes and transitions
- **Responsive Design**: Mobile-first approach

### API Configuration

The application includes a REST API structure for badge generation:

- **Endpoint**: `POST /api/badge/generate-suggestions`
- **Request**: `{ content: string }`
- **Response**: `BadgeGenerationResult`

## 📱 Usage

### 1. Landing Page

Visit the home page to see the application overview and navigation options.

### 2. Badge Generation

1. Navigate to `/genai`
2. Enter your content in the text area (minimum 50 characters)
3. Optionally upload files (PDF, DOC, DOCX)
4. Click "Generate" to create AI-powered badge suggestions
5. Review the generated suggestions on the results page

### 3. File Upload

The application supports:
- **PDF files**: Extracted using pdf-parse
- **Word documents**: Extracted using mammoth
- **Multiple files**: Upload and process multiple files simultaneously
- **Content validation**: Automatic word count and content validation

## 🔌 API Integration

### Current Implementation

The application currently uses mock data for badge generation. To integrate with a real API:

1. Update `src/app/api/badge/generate-suggestions/route.ts`
2. Replace the mock response with actual API calls
3. Update the API client configuration in `src/lib/api/`

### Example API Integration

```typescript
// In route.ts
const response = await fetch("https://your-api.com/generate-badge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});

const result = await response.json();
```

## 🎨 Customization

### Theme Customization

Modify `src/lib/theme/dcc-theme.ts` to update:
- Color palette
- Typography settings
- Brand-specific styling

### Component Customization

The application uses shadcn/ui components. To customize:
1. Modify components in `src/components/ui/`
2. Update `components.json` for configuration changes
3. Extend Tailwind configuration as needed

## 🚀 Deployment

### Firebase App Hosting

The application is configured for Firebase App Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy: `firebase deploy`

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Vercel
- Netlify
- AWS Amplify
- Docker containers

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Errors**: Ensure file size limits are appropriate
2. **API Errors**: Check network connectivity and API endpoint configuration
3. **Build Errors**: Run `npm run typecheck` to identify TypeScript issues
4. **Styling Issues**: Verify Tailwind CSS configuration and class names

### Development Tips

- Use `npm run dev` for development with hot reloading
- Check browser console for client-side errors
- Use Next.js dev tools for debugging
- Monitor network requests in browser dev tools

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue in the repository

---

**BadgeSmith** - Create verifiable digital badges with the power of AI! 🏆