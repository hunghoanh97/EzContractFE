# EzContractFE

EzContractFE is a modern React TypeScript frontend application for the EzContract system, providing a user-friendly interface for Vietnamese Business Registration System (DKKD) integration and contract management.

## 🚀 Features

- **Modern React + TypeScript**: Built with React 18 and TypeScript for type safety
- **Vite Build Tool**: Lightning-fast development and build process
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **DKKD Integration**: Seamless integration with Vietnamese Business Registration System
- **reCAPTCHA Support**: Google reCAPTCHA v2 integration for secure authentication
- **Responsive Design**: Mobile-first responsive design approach
- **Component Architecture**: Modular, reusable component structure
- **State Management**: Efficient state management with React hooks
- **API Integration**: Robust API service layer for backend communication
- **Vietnamese Localization**: Full support for Vietnamese language

## 📋 Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/hunghoanh97/EzContractFE.git
cd EzContractFE
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5364
VITE_RECAPTCHA_SITE_KEY=6LewYU4UAAAAAD9dQ51Cj_A_1uHLOXw9wJIxi9x0
```

### 4. Run Development Server
```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
EzContractFE/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, icons, fonts
│   ├── components/        # Reusable UI components
│   │   ├── Dashboard.tsx  # Main dashboard component
│   │   ├── DkkdLogin.tsx  # DKKD login component
│   │   ├── DkkdLoginIframe.tsx # iframe login approach
│   │   └── Empty.tsx      # Empty state component
│   ├── hooks/             # Custom React hooks
│   │   └── useTheme.ts    # Theme management hook
│   ├── lib/               # Utility functions
│   │   └── utils.ts       # General utility functions
│   ├── pages/             # Page components
│   │   └── Home.tsx       # Home page component
│   ├── services/          # API service layer
│   │   └── dkkdAuthService.ts # DKKD authentication service
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── README.md              # Project documentation
```

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and building. Configuration is in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### TypeScript Configuration
TypeScript configuration is in `tsconfig.json`:
- Target: ES2020
- Strict mode enabled
- JSX: react-jsx
- Path aliases configured for `@` pointing to `./src`

### Tailwind CSS Configuration
Tailwind CSS is configured in `tailwind.config.js`:
- Custom color scheme
- Extended spacing utilities
- Vietnamese font support

## 🎨 Styling

The project uses Tailwind CSS for styling with custom configurations:

```css
/* Custom color scheme */
@layer base {
  :root {
    --primary: #2563eb;
    --secondary: #64748b;
    --accent: #f59e0b;
  }
}
```

## 🔌 API Integration

### DKKD Authentication Service
The application integrates with the backend API for DKKD authentication:

```typescript
// API endpoints
const API_ENDPOINTS = {
  initialize: '/api/dkkdauth/initialize',
  login: '/api/dkkdauth/login',
  logout: '/api/dkkdauth/logout',
  validateSession: '/api/dkkdauth/session',
}
```

### Error Handling
Comprehensive error handling for API requests:
- Network errors
- Validation errors
- Authentication failures
- Session management

## 🔐 reCAPTCHA Integration

Google reCAPTCHA v2 is integrated for secure authentication:
- Site key: `6LewYU4UAAAAAD9dQ51Cj_A_1uHLOXw9wJIxi9x0`
- Supports both checkbox and invisible modes
- Proper error handling and user feedback

## 📱 Responsive Design

The application is fully responsive with mobile-first approach:
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly interface
- Optimized for mobile devices
- Progressive enhancement

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🧪 Testing

### Unit Tests
```bash
npm run test
# or
pnpm test
```

### Integration Tests
```bash
npm run test:integration
# or
pnpm test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
# or
pnpm test:e2e
```

### Build Test
```bash
npm run build
# or
pnpm build
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
pnpm build
```

### Preview Production Build
```bash
npm run preview
# or
pnpm preview
```

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify Deployment
1. Connect to Git provider
2. Build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`

## 🔒 Security

- **HTTPS**: All API requests use HTTPS
- **Input Validation**: Client-side input validation
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Content Security Policy**: CSP headers configured
- **Environment Variables**: Sensitive data in environment variables

## 📝 Environment Variables

Create a `.env` file for local development:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5364
VITE_API_TIMEOUT=30000

# reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
VITE_RECAPTCHA_THEME=light

# Application Configuration
VITE_APP_NAME=EzContract
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

## 🎨 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## 🌟 Features in Detail

### DKKD Login Component
- **Username/Password Authentication**: Traditional login form
- **reCAPTCHA Integration**: Google reCAPTCHA v2 support
- **Session Management**: Automatic session handling
- **Error Handling**: Comprehensive error messages in Vietnamese
- **Loading States**: Proper loading indicators

### Dashboard Component
- **User Information Display**: Show logged-in user details
- **Navigation**: Easy navigation between features
- **Responsive Layout**: Adapts to different screen sizes
- **Vietnamese Localization**: Full Vietnamese language support

### Iframe Login Component
- **Alternative Authentication**: iframe-based login approach
- **Direct DKKD Integration**: Direct interaction with DKKD system
- **Fallback Option**: Alternative when standard login fails

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React functional component patterns
- Use custom hooks for reusable logic
- Implement proper error boundaries
- Write meaningful component and function names

### Component Structure
```typescript
// Component structure example
import React from 'react'
import { useState, useEffect } from 'react'

interface ComponentProps {
  // Props interface
}

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    // JSX
  )
}

export default ComponentName
```

### State Management
- Use React hooks (useState, useEffect, useContext)
- Implement custom hooks for complex state logic
- Consider using Zustand for global state management
- Avoid prop drilling with proper context usage

## 🐛 Known Issues

- **reCAPTCHA Limitation**: Due to Google reCAPTCHA v2 security requirements, some authentication flows may require iframe approach
- **Browser Compatibility**: Some older browsers may not support all features
- **Mobile Performance**: Performance optimization ongoing for mobile devices

## 🗺️ Roadmap

- [ ] Implement headless browser automation for production reCAPTCHA handling
- [ ] Add comprehensive unit and integration tests
- [ ] Implement advanced error handling and recovery
- [ ] Add PWA (Progressive Web App) support
- [ ] Implement offline functionality
- [ ] Add advanced analytics and monitoring
- [ ] Implement advanced caching strategies
- [ ] Add multi-language support beyond Vietnamese

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the wiki for additional documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React community for excellent documentation and ecosystem
- Tailwind CSS for the amazing utility-first framework
- Vite for the blazing-fast build tool
- Vietnamese Business Registration System (DKKD) for the integration API
- Contributors and testers who helped improve the system