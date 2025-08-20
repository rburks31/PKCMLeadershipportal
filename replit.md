# PKCM Leadership and Ministry Class Learning Management System

## Overview

PKCM Leadership and Ministry Class (Promise Kingdom Community Ministries) is a comprehensive learning management system designed for pastoral and ministry leadership training. The platform provides a complete educational experience with courses, modules, lessons, video content, quizzes, discussion forums, and certificate generation. The system supports both instructors and students with features for content delivery, progress tracking, and community engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, using a modern component-based architecture. Key design decisions include:

- **Routing**: Uses Wouter for lightweight client-side routing with authentication-based route guards
- **State Management**: Leverages TanStack Query (React Query) for server state management with built-in caching, eliminating the need for complex global state solutions
- **UI Framework**: Implements Shadcn/UI with Radix UI primitives for accessible, customizable components
- **Styling**: Uses Tailwind CSS with a custom pastoral theme featuring branded colors and consistent design tokens
- **Authentication Flow**: Implements conditional rendering based on authentication state, redirecting unauthenticated users to a landing page

### Backend Architecture
The server-side follows a RESTful API design pattern with Express.js and TypeScript:

- **API Structure**: Organized route handlers with clear separation of concerns between authentication, courses, lessons, and user management
- **Middleware Design**: Custom logging middleware for API request tracking and error handling
- **File Organization**: Modular structure separating database operations, routing, authentication, and storage logic
- **Error Handling**: Centralized error handling with consistent JSON response formats

### Database Design
Uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Schema Strategy**: Relational design supporting users, courses, modules, lessons, enrollments, progress tracking, discussions, quizzes, and certificates
- **Data Integrity**: Foreign key relationships ensuring referential integrity across entities
- **Session Management**: Dedicated session storage for authentication state persistence
- **Migration Strategy**: Schema evolution through Drizzle Kit migration system

### Authentication System
Implements OpenID Connect (OIDC) integration with Replit authentication:

- **SSO Integration**: Seamless single sign-on experience for Replit users
- **Session Management**: Server-side sessions with PostgreSQL storage for security and persistence
- **Authorization**: Role-based access control supporting student, instructor, and admin roles
- **Security**: HTTP-only cookies with secure flags and session expiration handling

### Content Management
Supports multimedia content delivery and file management:

- **Video Integration**: Placeholder video player component with controls for lesson content
- **File Storage**: Google Cloud Storage integration for handling course materials and user-uploaded content
- **Progress Tracking**: Real-time lesson completion and quiz attempt tracking
- **Discussion System**: Threaded discussion forums for lesson-based community interaction

### Development Workflow
The build system supports both development and production environments:

- **Build Process**: Vite for frontend bundling with TypeScript compilation and hot module replacement
- **Development Server**: Express server with Vite middleware integration for seamless full-stack development
- **Type Safety**: Shared TypeScript schemas between client and server ensuring type consistency
- **Code Quality**: ESLint and TypeScript strict mode for code quality enforcement

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit OIDC provider for user authentication and authorization
- **File Storage**: Google Cloud Storage for media files and course materials
- **Session Store**: PostgreSQL-backed session storage with automatic cleanup

### Development Tools
- **Frontend Build**: Vite with React and TypeScript support
- **Backend Runtime**: Node.js with ES modules and TypeScript compilation via TSX
- **Database Management**: Drizzle ORM with PostgreSQL adapter and migration tools
- **UI Components**: Radix UI primitives with Shadcn/UI component library

### Third-Party Services
- **File Upload**: Uppy.js for drag-and-drop file upload functionality with AWS S3 support
- **Styling Framework**: Tailwind CSS with PostCSS for utility-first styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **HTTP Client**: Native fetch API with custom query client for server communication

### Production Deployment
- **Build Output**: Static frontend assets with server-side Express application
- **Environment Configuration**: Environment-based configuration for database connections and API endpoints
- **Error Monitoring**: Custom error logging and request tracking middleware