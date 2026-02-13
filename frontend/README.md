# DCC Gen-AI UI

A modern, AI-powered credential suggestion generator built with Next.js, React, and TypeScript. This application allows users to generate personalized badge suggestions through an intuitive streaming interface.

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
- **AWS CLI** (for deployment)
- **AWS Account** with S3 and CloudFront access

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/oneorigin-inc/mit-badge-front-end.git
cd mit-badge-front-end
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🏗️ Production Setup

### Environment Variables

Create `.env.local` for local:

Create `.env.production` for production:

```env
# Production API
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1


```

### Build for Production

```bash
# Build the application
npm run build

# Verify build output
ls -la out/
```

### Local Production Test

```bash
# Serve built files locally
npx serve out
```

## Docker

To run in a docker container:

```bash
docker build -t mit-badge-front-end --build-arg NEXT_PUBLIC_API_BASE_URL=SET_YOUR_API_ENDPOINT_HERE .
docker run -p 80:80 mit-badge-front-end
```

To serve on a different port than 80 adjust accordingly, e.g., to serve on 3000:

```bash
docker run -p 3000:80 mit-badge-front-end
```

## 🔧 Configuration

### API Configuration

The application uses a streaming API for real-time badge generation. Configure the API endpoint in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://your-api-server.com/api/v1
```





## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**:
   ```bash
   npm run dev
   npm run lint
   npm run typecheck
   ```

3. **Build and test production**:
   ```bash
   npm run build
   npx serve out
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request** and merge to `main` for deployment

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📊 Project Status

- **Status**: ✅ Production Ready
- **Monitoring**: ✅ GitHub Actions
- **Security**: ✅ Environment Variables

## 🔗 Links

- **Repository**: [https://github.com/oneorigin-inc/mit-badge-front-end](https://github.com/oneorigin-inc/mit-badge-front-end)
- **Issues**: [GitHub Issues](https://github.com/oneorigin-inc/mit-badge-front-end/issues)
