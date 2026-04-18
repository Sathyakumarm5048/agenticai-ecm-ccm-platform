# Frontend Setup Guide

**Status**: ✅ Step 1 Complete - Repository Structure Created

This guide walks you through setting up and installing the AgenticAI frontend applications.

## Overview

The frontend monorepo consists of:
- **design-studio** - Workflow visual builder (Vite, React 18, React Flow)
- **experience-ui** - Execution dashboard and monitoring
- **admin-console** - System administration
- **shared** - Reusable components and utilities

## Step 1: Repository Structure ✅ COMPLETED

✅ Directory structure created
✅ package.json files configured
✅ TypeScript configuration setup
✅ Build configuration (Vite) setup
✅ ESLint & Prettier configuration
✅ Environment files created
✅ Initial Redux slices created
✅ Placeholder pages created

**Files Created:**
- Frontend root with 4 packages
- Vite configs for all 3 apps
- TypeScript configs
- Redux store setup (design-studio)
- ESLint & Prettier configs
- Environment templates
- 450+ shared type definitions

---

## Step 2: Install Core Dependencies (NEXT)

### Prerequisites

Before proceeding, ensure you have:
- **Node.js** >= 18.0.0 (Check: `node --version`)
- **npm** >= 9.0.0 (Check: `npm --version`)

If you need to install Node.js:
- Download from https://nodejs.org (LTS version recommended)
- Install and verify with the version checks above

### Installation Steps

Navigate to frontend directory:
```bash
cd frontend
```

Install dependencies for all packages:
```bash
npm install
```

This will:
1. Install dependencies for root `package.json`
2. Install dependencies for `shared/` (required by all apps)
3. Install dependencies for `design-studio/`
4. Install dependencies for `experience-ui/`
5. Install dependencies for `admin-console/`

**Expected Output:**
```
added XXX packages, and audited XXX packages in Xm
found 0 vulnerabilities
```

### Dependency Groups

#### Core (All Applications)
- `react@18.2.0` - UI framework
- `react-dom@18.2.0` - DOM rendering
- `@reduxjs/toolkit@1.9.7` - State management
- `react-redux@8.1.3` - React bindings for Redux
- `redux-thunk@2.4.2` - Async actions
- `@mui/material@5.14.13` - Component library
- `axios@1.6.5` - HTTP client
- `socket.io-client@4.7.2` - WebSocket client
- `react-router-dom@6.20.0` - Routing

#### Design Studio Specific
- `reactflow@11.10.0` - Workflow canvas

#### Experience UI Specific
- `recharts@2.10.3` - Charts and visualization
- `framer-motion@10.16.16` - Animations

#### Development
- `vite@5.0.8` - Build tool
- `typescript@5.3.3` - Type checking
- `eslint` - Linting
- `prettier` - Code formatting
- `vitest` - Testing
- `@testing-library/react` - Component testing

### Verify Installation

After npm install, verify everything is working:

```bash
# Check that node_modules exists
ls -la node_modules | head -20

# Test TypeScript compilation
npm run type-check

# Verify all dependencies
npm list --depth=0
```

---

## Step 3: Start Development Servers (AFTER STEP 2)

### Start All Applications

```bash
npm run dev
```

This will start all three applications in parallel:
- Design Studio: http://localhost:5173
- Experience UI: http://localhost:5174
- Admin Console: http://localhost:5175

### Start Individual Applications

**Design Studio only:**
```bash
npm run dev:studio
```

**Experience UI only:**
```bash
npm run dev:experience
```

**Admin Console only:**
```bash
npm run dev:admin
```

### Verify Applications Started

Each application should:
1. Open automatically in your browser
2. Show "Workflow Builder - Coming Soon" (design-studio)
3. Show Material-UI layout rendered

If browser doesn't open automatically:
- Design Studio: Open http://localhost:5173
- Experience UI: Open http://localhost:5174
- Admin Console: Open http://localhost:5175

---

## Step 4: Code Quality Tools

### Linting

Check for code issues:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint:fix
```

### Type Checking

Verify TypeScript types:
```bash
npm run type-check
```

### Testing

Run unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

---

## Step 5: Building for Production

### Build All Applications

```bash
npm run build
```

### Build Specific Application

```bash
npm run build:studio
npm run build:experience
npm run build:admin
```

Build artifacts will be in `dist/` directory of each package.

### Preview Production Build

```bash
npm run preview
```

---

## Common Issues & Solutions

### Issue: npm install fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -rf node_modules package-lock.json

# Retry install
npm install
```

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 5173 (change port number as needed)
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

### Issue: TypeScript errors in editor
**Solution:**
```bash
# Reload TypeScript in your editor:
# VSCode: Cmd/Ctrl + Shift + P → TypeScript: Restart TS Server

# Or rebuild
npm run type-check
```

### Issue: Module not found errors
**Solution:**
```bash
# Ensure you're in the frontend directory
cd frontend

# Reinstall from scratch
rm -rf node_modules package-lock.json
npm install
```

---

## Next: Step 2 - Install Dependencies

Ready to proceed? Run:
```bash
cd frontend
npm install
```

Then follow the installation output verification steps above.

**Estimated time:** 5-10 minutes (depending on internet connection)

---

## Environment Configuration

Each application has `.env.local` pre-configured:

```env
VITE_API_BASE_URL=http://localhost:8008
VITE_WS_URL=ws://localhost:8080
VITE_NODE_ENV=development
```

Modify if your backend services run on different ports.

---

## Project Structure Reference

```
frontend/
├── shared/                 # Shared library (installed first)
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types (450+)
│   └── package.json
├── design-studio/          # Workflow builder
│   ├── src/
│   │   ├── components/
│   │   ├── pages/          # ✅ WorkflowList, WorkflowBuilder, etc.
│   │   ├── services/
│   │   ├── state/          # ✅ Redux slices
│   │   ├── styles/         # ✅ CSS
│   │   ├── App.tsx         # ✅ Main App
│   │   └── main.tsx        # ✅ Entry point
│   ├── vite.config.ts      # ✅ Build config
│   ├── tsconfig.json       # ✅ TypeScript config
│   ├── index.html          # ✅ HTML template
│   └── package.json        # ✅ Dependencies
├── experience-ui/          # Dashboard & monitoring
│   ├── (similar structure)
│   └── package.json
├── admin-console/          # System administration
│   ├── (similar structure)
│   └── package.json
├── package.json            # ✅ Root monorepo config
├── .eslintrc.cjs          # ✅ ESLint config
├── .prettierrc             # ✅ Prettier config
├── .env.example           # ✅ Env template
└── README.md              # ✅ Frontend docs
```

---

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Edit files**: Make changes to source files
3. **Hot reload**: Changes auto-refresh in browser
4. **Run linter**: `npm run lint:fix`
5. **Run tests**: `npm run test`
6. **Commit**: Push to version control

---

## Getting Help

For questions or issues:
1. Check [Frontend README](./README.md)
2. Review [UI_AND_CONNECTOR_ARCHITECTURE.md](../UI_AND_CONNECTOR_ARCHITECTURE.md)
3. Check [END_TO_END_WORKFLOW.md](../END_TO_END_WORKFLOW.md)
4. Review error messages carefully - they often indicate the solution

---

## Next Steps After Installation

After completing Step 2 (npm install):

1. **Step 3**: Verify development servers start
2. **Step 4**: Create shared components (Layout, Button, Modal)
3. **Step 5**: Build workflow canvas with React Flow
4. **Step 6**: Integrate API workflows endpoints
5. **Step 7**: Add real-time WebSocket support
6. **Step 8**: Build execution dashboard

---

**Ready to proceed to Step 2? Let's install the dependencies!**
