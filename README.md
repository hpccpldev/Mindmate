# Moodmate - AI Companion for Emotional Wellness

An advanced AI-powered emotional wellness platform providing personalized mental health support through intelligent, secure, and user-centric technology.

![Moodmate Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)

## 🌟 Overview

Moodmate is an AI-powered emotional wellness companion that provides personalized, non-clinical emotional support through intelligent conversations, mood tracking, journaling, and adaptive wellness interventions. The application features age-appropriate AI personas designed to address the unique mental health needs of different life stages, from teenagers to seniors.

## ✨ Key Features

### 🤖 AI-Powered Personas
- **5 Age-Appropriate AI Companions** based on Madhva Sampradaya tradition:
  - **Narahari** (Teen Wellness Buddy) - Ages 13-19
  - **Madhava** (Young Adult Navigator) - Ages 18-25  
  - **Jayatirtha** (Life Balance Coach) - Ages 25-55
  - **Vyasatirtha** (Wisdom & Wellness Guide) - Ages 55+
  - **Purandaradasa** (Inclusive Wellness Companion) - All ages

### 📊 Wellness Tracking
- **Mood Tracking**: Daily mood check-ins with 1-10 scale visualization
- **Progress Analytics**: Weekly and monthly trend analysis
- **Journal Entries**: AI-powered reflection prompts and emotional theme detection
- **Intervention Tracking**: Breathing exercises, CBT techniques, meditation progress

### 🛡️ Privacy & Security
- **Dual Authentication System**: User and Admin access with 3-factor verification
- **Privacy-First Design**: All data encrypted and stored securely
- **Crisis Detection**: AI monitors for crisis indicators with appropriate resources
- **Session Management**: Secure HTTP-only cookies with 7-day expiration

### 📱 User Experience  
- **Responsive Design**: Optimized for mobile and desktop
- **Dark Theme**: Consistent dark UI with slate-800/60 backgrounds
- **Real-time Conversations**: Natural language AI chat with emotional intelligence
- **Progress Visualization**: Interactive charts and wellness metrics

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with custom Moodmate design system
- **shadcn/ui** components built on Radix UI primitives
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing

### Backend Stack
- **Express.js** RESTful API with TypeScript
- **PostgreSQL** with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **Passport.js** with Replit OIDC authentication
- **OpenAI GPT-4o** for AI conversations and analysis

### Database Schema
```sql
-- Core tables
users              -- User profiles with persona selection
conversations      -- AI chat sessions
messages          -- Individual chat messages with emotional analysis
mood_entries      -- Daily mood tracking (1-10 scale)
journal_entries   -- Reflection entries with AI theme detection
interventions     -- Wellness activities and completion tracking
crisis_alerts     -- Admin monitoring for high-risk indicators
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- OpenAI API key
- Replit account (for authentication)

### Environment Variables
```bash
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=sk-your-openai-api-key
PGHOST=your-postgres-host
PGPORT=5432
PGDATABASE=your-database-name
PGUSER=your-username
PGPASSWORD=your-password
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hpccpldev/Mindmate.git
cd Mindmate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Run database migrations
npm run db:push
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏃‍♂️ Usage

### User Flow
1. **Authentication**: Login via Replit OIDC
2. **Persona Selection**: Choose age-appropriate AI companion
3. **Mood Check-in**: Daily mood tracking with optional notes
4. **AI Conversations**: Natural language emotional support
5. **Journaling**: AI-guided reflection with theme analysis
6. **Progress Review**: Weekly analytics and wellness trends

### Admin Access
1. Navigate to `/admin`
2. Enter admin email: `fictionwriter.arjun@gmail.com`
3. Admin key: `MOODMATE_ADMIN_2025`
4. Access crisis monitoring and user analytics

## 📊 AI Personas Details

| Persona | Age Group | Specialization | Approach |
|---------|-----------|----------------|----------|
| **Narahari** | 13-19 | Teen Wellness | Academic stress, social anxiety, identity exploration |
| **Madhava** | 18-25 | Young Adult Support | Career anxiety, independence transition, relationships |
| **Jayatirtha** | 25-55 | Life Balance | Work-life balance, parenting, career stress |
| **Vyasatirtha** | 55+ | Wisdom Guide | Life reflection, health concerns, grief, legacy |
| **Purandaradasa** | All Ages | Inclusive Support | Cultural sensitivity, LGBTQ+, neurodiversity |

## 🔒 Security Features

- **Three-Layer Admin Authentication**
  - Email verification
  - Access key validation  
  - Database admin flag check
- **Session Security**: HTTP-only cookies with CSRF protection
- **Data Encryption**: All sensitive data encrypted at rest
- **Crisis Intervention**: Automated detection with escalation protocols

## 🛠️ Development

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Route components
│   │   └── lib/         # Utilities and hooks
├── server/           # Express backend
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── middleware/      # Auth and validation
├── shared/           # Common TypeScript types
└── attached_assets/  # Static assets
```

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push database schema
npm run db:studio    # Open Drizzle Studio
```

## 📈 Analytics & Monitoring

### Dashboard Metrics
- Weekly conversation counts
- Mood trend analysis
- Journal entry frequency
- Intervention completion rates
- User engagement patterns

### Admin Analytics
- Crisis alert monitoring
- User risk assessment
- Platform usage statistics
- Conversation sentiment analysis

## 🌍 Deployment

### Replit Deployment
1. Connect to Replit
2. Set environment variables in Secrets
3. Run deployment workflow
4. Application available at `.replit.app` domain

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy to your preferred hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Madhva Sampradaya Tradition** for persona naming inspiration
- **OpenAI** for GPT-4o integration
- **shadcn/ui** for accessible component library
- **Replit** for development platform and authentication

## 📞 Support

For support and questions:
- Admin Contact: `fictionwriter.arjun@gmail.com`
- Crisis Support: Built-in crisis detection with resource links
- Platform Issues: Contact Replit support

---

**Built with ❤️ for mental wellness and emotional support**
