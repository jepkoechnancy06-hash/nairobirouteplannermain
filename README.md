# Veew Distributors - Route Optimization GIS

## Overview

Veew Distributors is a route optimization and fleet management system designed for distributors operating in the Huruma and Mathare areas of Nairobi, Kenya. The application enables management of retail shops, delivery drivers, route planning, and performance targets through an interactive GIS-based interface.

The system provides:
- Interactive map visualization with Leaflet for shop and driver locations
- CRUD operations for shops, drivers, routes, and targets
- Dashboard with real-time statistics and progress tracking
- Route optimization capabilities for delivery planning
- Dark/light theme support
- Admin-only authentication with email/password login
- **AI-Powered Analytics Portal** with OpenAI integration for:
  - Route Optimization: AI analyzes routes and suggests optimal delivery sequences
  - Demand Forecasting: Predicts shop restocking needs based on historical patterns
  - Driver Performance Analytics: AI-generated insights and recommendations
  - Fleet Reports: Comprehensive AI-powered business intelligence reports

## Authentication

The system uses custom email/password authentication with session-based security:
- **Login Page**: Email and password form at root when not authenticated
- **Admin User**: Single admin user with role-based access
- **Session Management**: PostgreSQL-backed sessions with 7-day expiry
- **Password Security**: bcrypt hashing with 10 rounds
- **Protected Routes**: All API endpoints require authentication

### Environment Variables
- `ADMIN_EMAIL`: Admin user email (default: hertlock3@gmail.com)
- `ADMIN_PASSWORD`: Admin user password (secret)
- `SESSION_SECRET`: Session encryption secret (secret)

### Password Recovery (SMTP)
- `SMTP_HOST`: SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_USER`: SMTP username/email
- `SMTP_PASS`: SMTP password or app password (secret)
- `SMTP_FROM`: Sender email address (defaults to SMTP_USER)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Map Integration**: Leaflet with react-leaflet for GIS functionality
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints under `/api` prefix
- **Development**: Vite middleware for HMR in development
- **Production**: Static file serving from built assets

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Current Storage**: In-memory storage implementation (`MemStorage` class)
- **Database Ready**: Schema configured for PostgreSQL with `drizzle-kit push`

### Key Design Patterns
- **Monorepo Structure**: Client, server, and shared code in single repository
- **Shared Types**: Schema definitions shared between frontend and backend via `@shared` alias
- **Type-Safe API**: Zod schemas derived from Drizzle tables for validation
- **Component Architecture**: Modular UI components with shadcn/ui conventions

### AI Analytics Architecture
- **AI Model**: OpenAI gpt-5.2 via Replit AI Integrations (billed to Replit credits)
- **Route Optimizer**: Nearest neighbor algorithm enhanced with AI suggestions
- **Demand Forecaster**: Analyzes delivery patterns to predict restocking needs
- **Driver Analytics**: AI-powered performance scoring and recommendations
- **Report Generator**: Comprehensive AI-generated business intelligence

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── pages/        # Route pages (incl. analytics.tsx)
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── ai/           # AI services (route-optimizer, demand-forecaster, driver-analytics)
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data storage interface
│   └── index.ts      # Server entry point
├── shared/           # Shared code
│   └── schema.ts     # Drizzle schema and types (incl. analytics tables)
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database toolkit with migrations support
- **connect-pg-simple**: PostgreSQL session store

### Frontend Libraries
- **Leaflet**: Interactive mapping library for GIS features
- **TanStack Query**: Data fetching and caching
- **Radix UI**: Accessible component primitives
- **Embla Carousel**: Carousel component
- **date-fns**: Date manipulation

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Production bundling for server
- **Drizzle Kit**: Database schema management

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner
