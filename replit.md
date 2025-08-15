# AI Companion for Emotional Wellness

## Overview

Moodmate is an AI-powered emotional wellness companion that provides personalized, non-clinical emotional support through intelligent conversations, mood tracking, journaling, and adaptive wellness interventions. The application features age-appropriate AI personas designed to address the unique mental health needs of different life stages, from teenagers to seniors. Users can select their preferred AI companion based on their age group and specific wellness requirements.

## Recent Changes

- **Brand Consistency (August 2025)**: Completed full rebrand from "MindfulAI" to "Moodmate" across all pages including landing page, dashboard, personas, chat interface, and admin login
- **Dark Theme Implementation**: Applied consistent dark theme with slate-800/60 backgrounds and white text throughout all UI components for optimal visibility
- **Landing Page Enhancement**: Updated all 6 feature blocks (Intelligent Conversations, Mood Tracking, Smart Journaling, Progress Insights, Privacy First, Wellness Tools) with white text and improved icon visibility against dark gradient background
- **Admin Access Simplification**: Removed admin buttons from landing page for cleaner user experience while maintaining admin access via direct URL
- **Charity Integration**: Replaced interventions statistics with donation/charity box featuring Indian Rupee symbol and HandHeart icon, encouraging support for mental health initiatives

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Component Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **State Management**: TanStack Query for server state management and caching
- **Styling**: Tailwind CSS with modern Moodmate color palette (purple primary, blue secondary, pink accent)
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design with dedicated mobile navigation components

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Session Management**: Express sessions with PostgreSQL store for persistence
- **Authentication**: Replit's OIDC authentication system with Passport.js
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development Tools**: Hot reload with Vite in development mode

### Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table (mandatory for Replit Auth)
  - Sessions table (mandatory for Replit Auth)
  - Conversations and Messages for AI chat history
  - Mood Entries for tracking emotional state over time
  - Journal Entries for reflection and self-analysis
  - Interventions for wellness activities tracking

### AI Integration
- **OpenAI GPT-4o**: Primary AI model for conversation and analysis
- **Emotional Analysis**: AI analyzes user input to understand emotional context and provide appropriate responses
- **Personalized Interventions**: System recommends breathing exercises, CBT techniques, meditation, and crisis resources
- **Journal Analysis**: AI provides insights and prompts for journaling activities

### Authentication & Security
- **Dual Authentication System**: 
  - **User Login**: Replit OIDC authentication for personal wellness access
  - **Admin Login**: Separate admin authentication with 3-factor verification:
    - Admin email verification
    - Admin access key: MOODMATE_ADMIN_2025
    - Database admin flag validation
- **Session Security**: Secure HTTP-only cookies with 7-day expiration
- **Privacy-First**: All user data encrypted and stored securely
- **Crisis Detection**: AI monitors for crisis indicators and provides appropriate resources
- **Admin Access Control**: Dedicated admin dashboard at /admin requiring special credentials
- **Landing Page**: Unified entry point with clear separation between user and admin access

### Key Features
- **Age-Appropriate AI Personas**: 5 distinct AI companions tailored for different life stages and demographics
- **AI Chat Interface**: Natural language conversations with emotional intelligence adapted to user's age group
- **Mood Tracking**: Daily mood check-ins with visualization and trend analysis
- **Smart Journaling**: AI-powered prompts and reflection analysis
- **Quick Interventions**: Age-appropriate breathing exercises, meditation, and coping strategies
- **Progress Analytics**: Dashboard showing wellness trends and activity summaries
- **Mobile Responsive**: Optimized experience across all device types

### AI Personas by Age Group (Madhva Sampradaya Names)
- **Narahari (Teen Wellness Buddy)**: Ages 13-19 - Academic stress, social anxiety, identity exploration
- **Madhava (Young Adult Navigator)**: Ages 18-25 - Career anxiety, independence transition, adult relationships
- **Jayatirtha (Life Balance Coach)**: Ages 25-55 - Work-life balance, parenting, career stress
- **Vyasatirtha (Wisdom & Wellness Guide)**: Ages 55+ - Life reflection, health concerns, grief, legacy
- **Purandaradasa (Inclusive Wellness Companion)**: All ages - Cultural sensitivity, LGBTQ+, neurodiversity support

#### Philosophical Foundation
The personas are named after significant figures from the Madhva Sampradaya (Dvaita Vedanta tradition):
- **Narahari Tirtha**: Direct disciple of Madhvacharya, represents youthful spiritual guidance
- **Madhava Tirtha**: Early successor in the lineage, symbolizes life transition support
- **Jayatirtha (1356-1388)**: Major systematizer of Dvaita philosophy, embodies balanced wisdom
- **Vyasatirtha (1469-1539)**: Influential scholar and spiritual guide for later life wisdom
- **Purandaradasa**: Saint-musician who made teachings accessible across cultures and languages

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for AI conversations and emotional analysis
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Authentication**: OIDC-based user authentication and session management

### Frontend Libraries
- **shadcn/ui + Radix UI**: Accessible component library for consistent UX
- **TanStack Query**: Server state management and API caching
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Wouter**: Lightweight client-side routing

### Backend Libraries
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Express.js**: Web application framework with middleware support
- **Passport.js**: Authentication middleware for OIDC integration

### Development Tools
- **Vite**: Build tool with hot module replacement
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds