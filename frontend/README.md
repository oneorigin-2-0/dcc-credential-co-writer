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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1

# AWS Configuration (for deployment)
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_S3_BUCKET=your-bucket-name

```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🏗️ Production Setup

### Environment Variables

Create `.env.production` for production:

```env
# Production API
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1

# AWS Configuration
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_S3_BUCKET=your-production-bucket

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



## 🚀 Deployment

### Automated Deployment (Recommended)

The application uses GitHub Actions for automated deployment to AWS S3 + CloudFront.

#### 1. GitHub Secrets Setup

Configure the following secrets in your GitHub repository:

**Go to**: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Deployment Configuration
AWS_S3_BUCKET=your-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

#### 2. AWS Infrastructure Setup

**S3 Bucket Configuration:**
```bash
# Create S3 bucket
aws s3 mb s3://your-bucket-name --region us-east-1

# Configure bucket policy for public access
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}'

# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html --error-document 404.html
```

**CloudFront Distribution:**
```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### 3. Deploy

```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

**Monitor deployment**: Check GitHub Actions tab for deployment status.

### Manual Deployment

#### 1. Build Application

```bash
npm run build
```

#### 2. Deploy to S3

```bash
# Sync files to S3
aws s3 sync ./out s3://your-bucket-name --delete

# Verify deployment
aws s3 ls s3://your-bucket-name --recursive
```

#### 3. Invalidate CloudFront Cache

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1

# AWS Configuration
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_S3_BUCKET=your-production-bucket

```

### Deployment URLs

- **S3 Website**: `https://your-bucket-name.s3-website-us-east-1.amazonaws.com`
- **CloudFront**: `https://d1234567890abc.cloudfront.net`
- **Custom Domain**: `https://your-domain.com` (if configured)

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

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_BASE_URL` is correct
   - Check if the API server is running
   - Ensure CORS is properly configured
   - Check network connectivity

2. **Streaming Not Working**
   - Check browser console for errors
   - Verify API supports Server-Sent Events
   - Check network connectivity
   - Ensure API endpoint is accessible

3. **File Upload Issues**
   - Ensure file size is within limits
   - Check file format is supported
   - Verify file parsing logic
   - Check browser compatibility

4. **Deployment Issues**
   - Verify GitHub secrets are configured correctly
   - Check AWS credentials and permissions
   - Ensure S3 bucket policy allows public access
   - Verify CloudFront distribution is active
   - Check GitHub Actions logs for errors

5. **Build Issues**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run typecheck`
   - Verify all dependencies are installed
   - Check Node.js version compatibility

### Performance Optimization

- **Build Analysis**: Use `npm run build` to check bundle size
- **Lighthouse**: Run Lighthouse audit for performance metrics
- **Network**: Monitor API response times
- **Caching**: Verify CloudFront cache headers

### Security Checklist

- [ ] Environment variables are properly configured
- [ ] API endpoints use HTTPS in production
- [ ] CORS is properly configured
- [ ] File uploads have size limits
- [ ] Sensitive data is not exposed in client-side code
- [ ] AWS credentials are stored as GitHub secrets

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a clear description

### Contribution Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass (`npm run lint`, `npm run typecheck`)
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Issues**: Create an issue in the repository
- **Documentation**: Check this README and code comments
- **Team**: Contact the development team
- **Security**: Report security issues privately


## 📊 Project Status

- **Status**: ✅ Production Ready
- **Deployment**: ✅ Automated (GitHub Actions)
- **CDN**: ✅ CloudFront Distribution
- **Monitoring**: ✅ GitHub Actions
- **Security**: ✅ Environment Variables + Secrets

## 🔗 Links

- **Repository**: [https://github.com/oneorigin-inc/mit-badge-front-end](https://github.com/oneorigin-inc/mit-badge-front-end)
- **Deployment**: [GitHub Actions](https://github.com/oneorigin-inc/mit-badge-front-end/actions)
- **Issues**: [GitHub Issues](https://github.com/oneorigin-inc/mit-badge-front-end/issues)
