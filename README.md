# English Tutor Backend

A production-ready Node.js backend application for a ChatGPT-like English learning platform. Built with Express, TypeScript, PostgreSQL, and Prisma.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Token rotation for enhanced security
  - Account lockout after failed login attempts
  - Password hashing with bcrypt (12+ rounds)

- **Chat Functionality**
  - Real-time message exchange with AI agent
  - Conversation management (create, read, delete)
  - Message history with pagination
  - Context-aware responses

- **Security**
  - Rate limiting on all endpoints
  - CORS protection
  - Helmet security headers
  - Input validation and sanitization
  - SQL injection prevention
  - XSS protection

- **Developer Experience**
  - TypeScript for type safety
  - Clean architecture with separation of concerns
  - Comprehensive error handling
  - Request/response logging
  - Health check endpoint
  - Database migrations
  - Example tests

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Logging**: Winston

## Project Structure

```
english-tutor/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── controllers/           # Route controllers
│   │   ├── authController.ts
│   │   ├── chatController.ts
│   │   └── healthController.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── requestLogger.ts
│   │   └── validate.ts
│   ├── routes/                # API routes
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── healthRoutes.ts
│   │   └── index.ts
│   ├── services/              # Business logic
│   │   ├── agentClient.ts     # Mock AI agent
│   │   ├── authService.ts
│   │   └── chatService.ts
│   ├── tests/                 # Test files
│   │   ├── integration/
│   │   ├── unit/
│   │   └── setup.ts
│   ├── utils/                 # Utility functions
│   │   ├── database.ts
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── .env.example               # Environment variables template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .prettierrc.json           # Prettier configuration
├── jest.config.js             # Jest configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd english-tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure the following:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_ACCESS_SECRET`: Secret for access tokens
   - `JWT_REFRESH_SECRET`: Secret for refresh tokens
   - Other configuration as needed

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed the database (optional)
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:8000`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Chat Endpoints

#### Send Message
```http
POST /api/chat/message
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "message": "Hello, I want to learn English!",
  "conversationId": "uuid" // Optional, creates new conversation if not provided
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "userMessage": {
      "id": "uuid",
      "role": "user",
      "content": "Hello, I want to learn English!",
      "format": "text",
      "status": "sent",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "assistantMessage": {
      "id": "uuid",
      "role": "assistant",
      "content": "Hello! I'm here to help...",
      "format": "markdown",
      "status": "sent",
      "timestamp": "2024-01-01T00:00:01.000Z",
      "metadata": {
        "model": "mock-agent-v1",
        "tokens": 25
      }
    }
  }
}
```

#### Get Conversation History
```http
GET /api/chat/history?page=1&limit=20
Authorization: Bearer <access-token>
```

#### Get Specific Conversation
```http
GET /api/chat/conversations/:conversationId
Authorization: Bearer <access-token>
```

#### Create New Conversation
```http
POST /api/chat/conversations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "My Conversation", // Optional
  "firstMessage": "Hello!" // Optional
}
```

#### Delete Conversation
```http
DELETE /api/chat/conversations/:conversationId
Authorization: Bearer <access-token>
```

#### Delete Message
```http
DELETE /api/chat/messages/:messageId
Authorization: Bearer <access-token>
```

### Health Check

```http
GET /health
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "english-tutor-backend",
    "version": "1.0.0",
    "environment": "development",
    "database": {
      "status": "connected"
    },
    "uptime": 123.456
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Generate coverage report
npm test -- --coverage
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

### Code Style

This project uses:
- ESLint for linting
- Prettier for code formatting
- TypeScript strict mode

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Apply migrations in production
npm run prisma:migrate:prod

# Reset database (development only)
npx prisma migrate reset
```

## Mock Agent Client

The application includes a mock AI agent client (`src/services/agentClient.ts`) that simulates AI responses. This allows the backend to be developed and tested independently of the actual AI service.

### Mock Response Types

The mock agent provides context-aware responses based on message content:

- Messages containing "code" → Returns code examples
- Messages containing "table" → Returns markdown tables
- Messages containing "help" → Returns help information
- Messages containing "grammar" → Returns grammar lessons
- Messages containing "vocabulary" → Returns vocabulary tips
- Default → Returns helpful conversational responses

### Replacing with Real Agent Service

To integrate with a real AI agent service:

1. Update `AGENT_SERVICE_URL` in `.env`
2. Implement `sendMessageToRealAgent()` function in `src/services/agentClient.ts`
3. Update chat service to use the real implementation

## Deployment

### Environment Setup

Ensure the following environment variables are set in production:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database URL
- `JWT_ACCESS_SECRET` - Strong secret (use a random string generator)
- `JWT_REFRESH_SECRET` - Different strong secret
- `CORS_ORIGIN` - Your frontend URL
- All other variables from `.env.example`

### Docker Deployment (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist

EXPOSE 8000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t english-tutor-backend .
docker run -p 8000:8000 --env-file .env english-tutor-backend
```

### Traditional Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set up PostgreSQL database

3. Run migrations:
   ```bash
   npm run prisma:migrate:prod
   ```

4. Start the server:
   ```bash
   NODE_ENV=production npm start
   ```

### Using a Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/server.js --name english-tutor-backend
pm2 startup
pm2 save
```

## Monitoring

The application includes:

- Health check endpoint at `/health`
- Winston logging to files (`logs/app.log`, `logs/error.log`)
- Request/response logging
- Database connection monitoring
- Graceful shutdown handling

## Security Best Practices

- Never commit `.env` file
- Use strong JWT secrets (32+ characters)
- Enable HTTPS in production
- Keep dependencies updated
- Review and rotate secrets regularly
- Monitor failed login attempts
- Set up database backups
- Use environment-specific configurations

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=8001

# Or find and kill the process
lsof -ti:8000 | xargs kill
```

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist
npm run build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting and tests
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on the repository.
