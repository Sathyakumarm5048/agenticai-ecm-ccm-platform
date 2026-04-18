# AgenticAI Frontend

Interactive workflow design and execution management platform for AgenticAI.

## Overview

This monorepo contains three main applications:

- **Design Studio** - Visual workflow builder (Vite + React)
- **Experience UI** - Execution dashboard and monitoring (Vite + React)
- **Admin Console** - System administration and connector management (Vite + React)

All applications share common components and utilities through the **shared** package.

## Architecture

```
frontend/
├── design-studio/          # Workflow designer application
├── experience-ui/          # Execution dashboard application
├── admin-console/          # Admin system application
└── shared/                 # Shared components, hooks, utilities
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
cd frontend
npm install
```

### Development

Start all applications:
```bash
npm run dev
```

Or start individual applications:
```bash
npm run dev:studio      # Design Studio on http://localhost:5173
npm run dev:experience  # Experience UI on http://localhost:5174
npm run dev:admin       # Admin Console on http://localhost:5175
```

### Building

Build all applications:
```bash
npm run build
```

Or build specific applications:
```bash
npm run build:studio
npm run build:experience
npm run build:admin
```

## Tech Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast, modern)

### State Management
- **Redux Toolkit** - Predictable state management
- **Redux Thunk** - Async actions

### Real-Time
- **socket.io-client** - WebSocket with fallbacks
- **rxjs** - Reactive programming (optional)

### UI Components
- **Material-UI (MUI)** - Component library
- **React Flow** - Workflow canvas (design-studio)
- **Recharts** - Charts and visualizations

### HTTP Client
- **axios** - HTTP requests with interceptors

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** - E2E testing

## Project Structure

### Design Studio
```
design-studio/src/
├── components/        # React components
│   ├─ WorkflowCanvas.tsx      # Main canvas component
│   ├─ StepEditor.tsx          # Step configuration
│   ├─ StepLibrary.tsx         # Available steps
│   └─ ConnectionModal.tsx     # Connector config
├── pages/             # Page components
│   ├─ WorkflowBuilder.tsx
│   ├─ WorkflowList.tsx
│   ├─ VersionHistory.tsx
│   └─ Templates.tsx
├── services/          # API & external services
│   ├─ workflowApi.ts
│   ├─ connectorApi.ts
│   └─ mockData.ts
├── state/             # Redux slices
│   ├─ workflowSlice.ts
│   ├─ editorSlice.ts
│   └─ connectorSlice.ts
├── styles/            # CSS/styling
├── App.tsx
└── main.tsx
```

### Experience UI
```
experience-ui/src/
├── components/        # React components
│   ├─ ExecutionTimeline.tsx
│   ├─ AgentActionLog.tsx
│   ├─ MetricsDashboard.tsx
│   ├─ IncidentPanel.tsx
│   ├─ ApprovalWidget.tsx
│   └─ NotificationCenter.tsx
├── pages/             # Page components
│   ├─ Dashboard.tsx
│   ├─ ExecutionDetail.tsx
│   ├─ HistoryView.tsx
│   ├─ InsightsView.tsx
│   └─ SettingsView.tsx
├── services/          # API & services
│   ├─ executionApi.ts
│   ├─ websocketService.ts
│   └─ analyticsService.ts
├── state/             # Redux slices
│   ├─ executionSlice.ts
│   ├─ uiSlice.ts
│   └─ metricsSlice.ts
├── hooks/             # Custom hooks
│   ├─ useExecution.ts
│   ├─ useWebSocket.ts
│   ├─ useMetrics.ts
│   └─ useNotification.ts
├── styles/
├── App.tsx
└── main.tsx
```

### Admin Console
```
admin-console/src/
├── components/        # React components
│   ├─ ConnectorManager.tsx
│   ├─ UserManager.tsx
│   ├─ AuditLog.tsx
│   ├─ SLAManager.tsx
│   └─ SystemSettings.tsx
├── pages/             # Page components
│   ├─ ConnectorCatalog.tsx
│   ├─ Integrations.tsx
│   ├─ Users.tsx
│   ├─ Audit.tsx
│   ├─ SLAs.tsx
│   └─ System.tsx
├── services/          # API services
│   ├─ connectorApi.ts
│   ├─ adminApi.ts
│   └─ auditApi.ts
├── state/             # Redux slices
│   ├─ connectionsSlice.ts
│   ├─ usersSlice.ts
│   └─ auditSlice.ts
├── styles/
├── App.tsx
└── main.tsx
```

### Shared
```
shared/
├── components/        # Shared UI components
│   ├─ Layout.tsx
│   ├─ Navigation.tsx
│   ├─ DataTable.tsx
│   ├─ Modal.tsx
│   ├─ Button.tsx
│   └─ LoadingSpinner.tsx
├── hooks/             # Shared hooks
│   ├─ useApi.ts
│   ├─ useLocalStorage.ts
│   └─ useTheme.ts
├── utils/             # Utilities
│   ├─ apiClient.ts
│   ├─ dateFormatting.ts
│   ├─ errorHandler.ts
│   └─ validators.ts
└── types/             # Shared types
    ├─ workflow.ts
    ├─ connector.ts
    ├─ execution.ts
    └─ api.ts
```

## API Integration

All applications integrate with the backend APIs:

- **API Gateway**: `http://localhost:8008`
- **Workflows**: `http://localhost:8008/route/orchestrator/workflows`
- **Executions**: `http://localhost:8008/route/orchestrator/executions`
- **Connectors**: `http://localhost:8008/route/*/connectors`
- **WebSocket**: `ws://localhost:8080/ws/executions/{execution_id}`

See [UI_AND_CONNECTOR_ARCHITECTURE.md](../UI_AND_CONNECTOR_ARCHITECTURE.md) for detailed API specifications.

## Testing

### Unit Tests
```bash
npm run test
npm run test:watch    # Watch mode
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test -- --coverage
```

## Linting & Formatting

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run type-check    # TypeScript type checking
```

## Environment Variables

Create `.env.local` files in each application:

```bash
# For all applications
VITE_API_BASE_URL=http://localhost:8008
VITE_WS_URL=ws://localhost:8080
VITE_NODE_ENV=development

# Application specific (if needed)
VITE_DESIGN_STUDIO_PORT=5173
VITE_EXPERIENCE_UI_PORT=5174
VITE_ADMIN_CONSOLE_PORT=5175
```

## Documentation

- [END_TO_END_WORKFLOW.md](../END_TO_END_WORKFLOW.md) - Complete system architecture
- [UI_AND_CONNECTOR_ARCHITECTURE.md](../UI_AND_CONNECTOR_ARCHITECTURE.md) - UI/UX and connector specifications
- Individual app READMEs in each package directory

## Development Workflow

1. **Feature Branch**: `git checkout -b feature/feature-name`
2. **Development**: Make changes, run `npm run dev` for hot-reload
3. **Testing**: Run `npm run test` before committing
4. **Linting**: Run `npm run lint:fix` to auto-fix issues
5. **Build**: Run `npm run build` to test production build
6. **Commit**: Include descriptive commit messages
7. **Pull Request**: Submit for review

## Build for Production

```bash
npm run build          # Build all applications
npm run preview        # Preview production builds
```

Build artifacts are in `dist/` directories of each package.

## Performance Tips

- Use Redux DevTools in development
- Lazy load routes with `React.lazy()`
- Use `React.memo()` for expensive components
- Monitor bundle size with `npm run build -- --analyze`
- Enable gzip compression in production

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass
5. Request code review before merging

## Support & Issues

For issues or questions:
1. Check existing documentation
2. Review [END_TO_END_WORKFLOW.md](../END_TO_END_WORKFLOW.md)
3. Check [UI_AND_CONNECTOR_ARCHITECTURE.md](../UI_AND_CONNECTOR_ARCHITECTURE.md)
4. File an issue with detailed description

## License

Part of AgenticAI Platform - Enterprise Edition
