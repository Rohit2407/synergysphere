# Overview

SynergySphere is an advanced team collaboration platform designed as a full-stack web application. It serves as an intelligent backbone for teams, providing comprehensive project management, task tracking, real-time communication, and team coordination capabilities. The application is built to be both desktop and mobile-ready, offering a seamless experience across all devices.

The platform addresses common team collaboration pain points including scattered information, unclear progress tracking, resource management confusion, deadline surprises, and communication gaps. It provides a centralized hub for project management with features like user authentication, project creation, team member management, task assignment with deadlines, status tracking, threaded discussions, and real-time notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built using React with TypeScript, utilizing modern React patterns and hooks. The UI framework leverages shadcn/ui components built on Radix UI primitives for accessibility and customization. Styling is handled through Tailwind CSS with a comprehensive design system including CSS variables for theming. The application uses Wouter for lightweight client-side routing and TanStack Query (React Query) for efficient server state management and caching. The frontend is responsive-first, supporting both desktop and mobile interfaces with dedicated mobile navigation components.

## Backend Architecture
The server is built on Express.js with TypeScript, following a RESTful API design pattern. The application uses session-based authentication with Passport.js and the Local Strategy for user login. WebSocket integration provides real-time features for live collaboration, including task updates and comments. The server implements comprehensive error handling and logging middleware for debugging and monitoring.

## Data Storage Solutions
The application uses PostgreSQL as the primary database, accessed through Drizzle ORM for type-safe database operations. The database schema includes tables for users, projects, project members, tasks, task comments, and discussions with proper foreign key relationships. Neon Database is used as the PostgreSQL provider, configured for serverless deployment. Database migrations are managed through Drizzle Kit.

## Authentication and Authorization
User authentication is implemented using Passport.js with session-based authentication stored server-side. Passwords are securely hashed using bcrypt before storage. The system includes user registration and login functionality with proper validation using Zod schemas. Session management is handled through express-session with configurable security settings.

## Component Architecture
The frontend follows a modular component structure with reusable UI components in the `/components/ui` directory. Business logic components are organized by feature areas (project management, task management, user interface). The application uses a context-based authentication system for managing user state across components. Custom hooks are implemented for mobile detection, WebSocket management, and toast notifications.

# External Dependencies

- **Database**: Neon Database (PostgreSQL) for data persistence with connection pooling
- **UI Framework**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Form Handling**: React Hook Form with Zod for validation and type safety
- **Date Management**: date-fns for date formatting and manipulation
- **Icons**: Lucide React for consistent iconography
- **Real-time Communication**: WebSocket (ws) for live collaboration features
- **Development Tools**: Vite for build tooling and development server
- **Password Security**: bcrypt for password hashing
- **Session Storage**: express-session with potential PostgreSQL session store
- **ORM**: Drizzle ORM for type-safe database operations
- **Query Management**: TanStack Query for server state management and caching