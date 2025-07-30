# Authentication Implementation Plan

## Overview
This plan implements a complete authentication system using NextAuth 5.0.0-beta with Google, GitHub, and Apple OAuth providers. The implementation follows an incremental approach with each step building on the previous ones.

## Phase 1: Foundation Setup

### Step 1.1: Install NextAuth Dependencies
**Objective**: Install NextAuth 5.0.0-beta and required OAuth provider packages

**Prompt for Implementation**:
```
Install NextAuth 5.0.0-beta and OAuth provider dependencies for the quotes database application.

Requirements:
- Install next-auth@beta (5.0.0-beta version)
- Install OAuth provider packages for Google, GitHub, and Apple
- Update package.json with proper version constraints
- Install any additional type definitions needed for TypeScript support

Current dependencies in package.json include Next.js 15.4.3, React 19, Prisma 6.1.0, and TypeScript.

After installation, verify that the packages are properly installed and compatible with the existing Next.js 15 setup.
```

### Step 1.2: Database Schema Extension
**Objective**: Extend Prisma schema with user management and session handling

**Prompt for Implementation**:
```
Extend the existing Prisma schema to support NextAuth 5.0.0-beta user management.

Current schema context:
- Uses PostgreSQL with Prisma ORM
- Has Quote, QuoteLine, Character, Actor, Movie, TvShow, Season, Episode models
- Uses CUID for primary keys
- Quote model needs to be extended to track creatorship

Requirements:
- Add NextAuth 5.0 compatible User, Account, Session, and VerificationToken models
- Add User model with: id (cuid), name, email, emailVerified, image, displayName (unique, max 15 chars), createdAt, updatedAt
- Add createdBy field to Quote model referencing User.id
- Ensure all relationships are properly defined with cascade delete where appropriate
- Follow NextAuth 5.0 database schema requirements
- Maintain consistency with existing schema patterns (cuid IDs, timestamps, naming conventions)

After schema changes, generate a new migration and update the Prisma client.
```

### Step 1.3: Environment Configuration
**Objective**: Set up environment variables and NextAuth configuration

**Prompt for Implementation**:
```
Create NextAuth configuration and environment setup for the quotes database application.

Requirements:
- Create .env.local.example with all required environment variables
- Set up src/lib/auth.ts with NextAuth configuration for Google, GitHub, and Apple providers
- Configure session strategy, callbacks, and provider settings
- Set up proper TypeScript types for NextAuth
- Include database adapter configuration for Prisma
- Set up JWT and session configuration

Environment variables needed:
- NEXTAUTH_URL, NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET  
- APPLE_CLIENT_ID, APPLE_CLIENT_SECRET, APPLE_KEY_ID, APPLE_TEAM_ID, APPLE_PRIVATE_KEY

Ensure configuration follows NextAuth 5.0.0-beta patterns and integrates with the existing Prisma setup.
```

## Phase 2: Authentication Core

### Step 2.1: NextAuth API Routes
**Objective**: Set up NextAuth API routes and handlers

**Prompt for Implementation**:
```
Set up NextAuth 5.0.0-beta API routes in the Next.js 15 App Router structure.

Current project context:
- Uses Next.js 15 with App Router (src/app directory structure)
- TypeScript configuration with strict mode
- Existing API routes may be in src/app/api

Requirements:
- Create src/app/api/auth/[...nextauth]/route.ts with proper NextAuth handlers
- Implement GET and POST handlers for the authentication endpoints
- Ensure compatibility with Next.js 15 App Router
- Add proper TypeScript types and error handling
- Include support for all three OAuth providers (Google, GitHub, Apple)
- Integrate with the Prisma database adapter

Make sure the route handlers follow Next.js 15 App Router conventions and NextAuth 5.0.0-beta patterns.
```

### Step 2.2: Session Provider Setup
**Objective**: Set up session context and provider for the application

**Prompt for Implementation**:
```
Set up NextAuth session provider and context for the quotes database application.

Current project structure:
- Next.js 15 with App Router
- TypeScript with React 19
- Existing layout structure in src/app

Requirements:
- Create src/components/providers/SessionProvider.tsx wrapper component
- Update src/app/layout.tsx to include session provider
- Set up proper TypeScript types for session data
- Ensure client-side session handling works correctly
- Add session provider configuration for NextAuth 5.0.0-beta
- Maintain existing layout structure and styling

The session provider should wrap the entire application and make session data available to all components.
```

### Step 2.3: Authentication Utilities
**Objective**: Create utility functions for authentication operations

**Prompt for Implementation**:
```
Create authentication utility functions for the quotes database application.

Requirements:
- Create src/lib/auth-utils.ts with authentication helper functions
- Implement server-side session retrieval functions
- Add client-side authentication state helpers
- Create user creation and profile setup utilities
- Add display name validation functions (unique check, length validation)
- Include error handling utilities for authentication operations
- Add TypeScript types for authentication operations

Functions needed:
- getServerSession() wrapper
- createUserProfile(displayName: string)
- validateDisplayName(displayName: string)
- checkDisplayNameUnique(displayName: string)
- getUserByEmail(email: string)

Ensure all utilities work with NextAuth 5.0.0-beta and integrate with the Prisma database.
```

## Phase 3: User Interface Components

### Step 3.1: Authentication Modal Component
**Objective**: Create the main authentication modal with popup handling

**Prompt for Implementation**:
```
Create an authentication modal component with popup-based sign-in flow.

Current project context:
- Uses Tailwind CSS for styling
- React 19 with TypeScript
- NextAuth 5.0.0-beta session management

Requirements:
- Create src/components/auth/AuthModal.tsx
- Implement popup-first authentication flow with fallbacks:
  1. Try popup window
  2. Fallback to new tab
  3. Fallback to current window with redirect
- Include sign-in buttons for Google, GitHub, and Apple providers
- Add proper error handling and user feedback
- Style with Tailwind CSS following existing design patterns
- Include loading states and proper accessibility
- Handle popup blocking and cross-origin issues

The modal should be reusable and handle all authentication scenarios gracefully.
```

### Step 3.2: Display Name Setup Modal
**Objective**: Create modal for first-time user display name setup

**Prompt for Implementation**:
```
Create a display name setup modal for new users after successful OAuth sign-in.

Current project context:
- Tailwind CSS styling
- React 19 with TypeScript
- Form validation patterns

Requirements:
- Create src/components/auth/DisplayNameModal.tsx
- Implement blocking modal that prevents interaction until completed
- Add form with display name input (max 15 characters)
- Include real-time validation with error messages
- Check display name uniqueness against database
- Handle form submission and user profile creation
- Style with Tailwind CSS with proper focus management
- Add loading states during submission
- Include proper error handling for all scenarios

Error messages:
- "Display name must be 15 characters or less"
- "That display name is already in use. Please choose another."
- "Unable to save display name. Please try again."

The modal should be user-friendly and ensure successful profile completion.
```

### Step 3.3: Sign-In/Sign-Out Button Components
**Objective**: Create reusable authentication action buttons

**Prompt for Implementation**:
```
Create sign-in and sign-out button components for the quotes database application.

Current project context:
- Tailwind CSS for styling
- NextAuth 5.0.0-beta session management
- React 19 with TypeScript

Requirements:
- Create src/components/auth/SignInButton.tsx
- Create src/components/auth/SignOutButton.tsx
- Implement conditional rendering based on authentication state
- Add loading states during authentication operations
- Include proper error handling and user feedback
- Style buttons with Tailwind CSS following existing design patterns
- Add accessibility features (ARIA labels, keyboard navigation)
- Handle authentication modal triggering from SignInButton

The buttons should integrate seamlessly with the existing UI and provide clear user feedback.
```

## Phase 4: Access Control Implementation

### Step 4.1: Route Protection Middleware
**Objective**: Implement middleware for protecting authenticated routes

**Prompt for Implementation**:
```
Create middleware for protecting authenticated routes in the quotes database application.

Current project context:
- Next.js 15 App Router
- NextAuth 5.0.0-beta
- Mixed authentication (public browsing, protected creation)

Requirements:
- Create src/middleware.ts for route protection
- Protect quote creation routes (require authentication)
- Allow public access to browsing routes
- Handle unauthenticated access gracefully
- Add proper redirects and error handling
- Include user settings page protection
- Configure middleware to work with NextAuth 5.0.0-beta session handling

Protected routes:
- /quotes/new (quote creation)
- /settings (user settings)
- Any quote editing routes (future)

Public routes:
- / (home/browsing)
- /quotes/* (quote viewing)
- /auth/* (authentication pages)

The middleware should seamlessly handle authentication checks without disrupting user experience.
```

### Step 4.2: Quote Creation Protection
**Objective**: Add authentication requirements to quote creation functionality

**Prompt for Implementation**:
```
Update quote creation functionality to require authentication and track ownership.

Current project context:
- Existing quote creation system with Quote and QuoteLine models
- Updated database schema with User model and createdBy field
- NextAuth 5.0.0-beta session management

Requirements:
- Update quote creation API routes to require authentication
- Modify quote creation forms to check authentication state
- Add user session validation before allowing quote creation
- Update database operations to include createdBy field
- Add proper error handling for unauthenticated attempts
- Trigger authentication modal when unauthenticated users try to create quotes
- Ensure existing quote functionality remains unaffected

The implementation should seamlessly integrate authentication requirements without breaking existing functionality.
```

## Phase 5: User Management Features

### Step 5.1: User Settings Page Structure
**Objective**: Create the user settings page layout and navigation

**Prompt for Implementation**:
```
Create a user settings page for authenticated users in the quotes database application.

Current project context:
- Next.js 15 App Router structure
- Tailwind CSS styling
- Protected route requiring authentication

Requirements:
- Create src/app/settings/page.tsx
- Implement settings page layout with navigation
- Add sections for:
  - Display name management
  - Connected accounts/OAuth providers
  - Account information display
- Include proper authentication checks and redirects
- Style with Tailwind CSS following existing design patterns
- Add breadcrumb navigation and page title
- Ensure responsive design

The page should serve as a foundation for all user management features.
```

### Step 5.2: Display Name Management
**Objective**: Implement display name editing functionality

**Prompt for Implementation**:
```
Implement display name editing functionality in the user settings page.

Current project context:
- User settings page structure
- Display name validation utilities
- NextAuth session management

Requirements:
- Create src/components/settings/DisplayNameSection.tsx
- Add form for editing current display name
- Include current display name display and edit mode toggle
- Implement same validation as initial setup (15 chars, uniqueness)
- Add real-time validation feedback
- Handle form submission and database updates
- Include success/error messaging
- Add loading states during updates
- Ensure form accessibility and proper error handling

The component should provide a smooth editing experience with proper validation.
```

### Step 5.3: Account Linking Management
**Objective**: Display and manage connected OAuth providers

**Prompt for Implementation**:
```
Create account linking management for OAuth providers in user settings.

Current project context:
- User settings page with display name management
- NextAuth 5.0.0-beta with Google, GitHub, Apple providers
- Account model in database schema

Requirements:
- Create src/components/settings/AccountLinkingSection.tsx
- Display currently connected OAuth providers
- Show provider icons and connection status
- Add functionality to link additional providers
- Include unlinking capabilities (with safeguards)
- Handle provider linking through NextAuth
- Add proper error handling and user feedback
- Style with Tailwind CSS and provider brand colors
- Ensure users maintain at least one connected account

The component should provide clear visibility and control over account connections.
```

## Phase 6: Error Handling and Polish

### Step 6.1: Comprehensive Error Handling
**Objective**: Implement robust error handling across all authentication flows

**Prompt for Implementation**:
```
Implement comprehensive error handling for all authentication scenarios.

Current project context:
- Complete authentication system with modals, settings, and protection
- NextAuth 5.0.0-beta with three OAuth providers
- Various error scenarios defined in specification

Requirements:
- Create src/lib/auth-errors.ts with error handling utilities
- Implement error message constants and formatting
- Add error boundary components for authentication flows
- Update all authentication components with proper error handling
- Include network error handling and retry mechanisms
- Add toast notifications or alert systems for errors
- Handle OAuth provider errors gracefully
- Include authentication cancellation handling

Error messages to implement:
- "Authentication was cancelled. You'll need to sign in to add quotes."
- "There was a problem signing in with [Provider]. Please try again."
- "That display name is already in use. Please choose another."
- "Unable to complete sign-in. Please check your connection and try again."

Ensure consistent error handling across the entire authentication system.
```

### Step 6.2: Testing and Validation
**Objective**: Test all authentication flows and edge cases

**Prompt for Implementation**:
```
Create comprehensive tests for the authentication system and validate all flows.

Current project context:
- Complete authentication implementation
- Jest testing framework
- NextAuth 5.0.0-beta integration

Requirements:
- Create test files for authentication utilities and components
- Test authentication flows (sign-in, sign-out, profile setup)
- Test display name validation and uniqueness
- Test OAuth provider integration
- Test route protection and access control
- Test error handling scenarios
- Include integration tests for complete flows
- Add mocking for NextAuth and database operations
- Test responsive design and accessibility

Tests should cover:
- User registration flow
- Display name validation
- Route protection
- Settings page functionality
- Error scenarios
- Session management

Ensure all authentication features work correctly and handle edge cases properly.
```

### Step 6.3: Final Integration and Documentation
**Objective**: Complete integration, cleanup, and create user documentation

**Prompt for Implementation**:
```
Complete final integration of authentication system and create documentation.

Current project context:
- Fully implemented authentication system
- All components and flows tested
- NextAuth 5.0.0-beta integration complete

Requirements:
- Perform final integration testing of all authentication flows
- Update existing components to properly integrate with authentication
- Add authentication status indicators throughout the application
- Create user-facing documentation for authentication features
- Update developer documentation with implementation details
- Perform final code cleanup and optimization
- Ensure proper TypeScript types throughout
- Add JSDoc comments to public functions
- Verify all success criteria are met

Final checklist:
- All OAuth providers working (Google, GitHub, Apple)
- Popup authentication with fallbacks functional
- Display name setup and editing working
- Route protection active
- User settings page complete
- Error handling comprehensive
- All tests passing

The system should be production-ready with complete documentation.
```

## Implementation Notes

### Key Considerations
- Each step builds incrementally on previous work
- No orphaned code - everything integrates with existing functionality
- Maintains existing application structure and patterns
- Follows NextAuth 5.0.0-beta best practices
- Ensures TypeScript compatibility throughout
- Maintains database consistency with existing schema patterns

### Dependencies Between Steps
- Steps 1.1-1.3 must be completed before Phase 2
- Phase 2 must be complete before implementing UI components
- Authentication components must exist before implementing access control
- User management features require completed authentication core
- Error handling and testing come after full implementation

### Success Validation
After each phase, verify:
- No TypeScript errors
- All imports resolve correctly
- Database migrations apply successfully
- Authentication flows work end-to-end
- Existing functionality remains unaffected
- Error handling works as expected