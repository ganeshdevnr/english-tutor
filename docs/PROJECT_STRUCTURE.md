# Project Structure

Complete overview of the English Tutor Backend codebase organization.

## Directory Tree

```
english-tutor/
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── .prettierrc.json                # Prettier formatting rules
├── jest.config.js                  # Jest testing configuration
├── nodemon.json                    # Nodemon development configuration
├── package.json                    # Project dependencies and scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── README.md                       # Project documentation
│
├── docs/                           # Additional documentation
│   ├── API_DOCUMENTATION.md        # Complete API reference
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── PROJECT_STRUCTURE.md        # This file
│
├── prisma/                         # Database schema and migrations
│   ├── schema.prisma               # Prisma schema definition
│   ├── seed.ts                     # Database seeding script
│   └── migrations/                 # Database migration files (auto-generated)
│
├── logs/                           # Application logs (gitignored)
│   ├── app.log                     # Combined logs
│   └── error.log                   # Error logs only
│
└── src/                            # Source code
    ├── config/                     # Configuration management
    │   └── index.ts                # Centralized config with env variables
    │
    ├── controllers/                # Request handlers (thin layer)
    │   ├── authController.ts       # Authentication endpoints
    │   ├── chatController.ts       # Chat endpoints
    │   └── healthController.ts     # Health check endpoint
    │
    ├── middleware/                 # Express middleware
    │   ├── auth.ts                 # JWT authentication & authorization
    │   ├── errorHandler.ts         # Global error handling
    │   ├── rateLimiter.ts          # Rate limiting configurations
    │   ├── requestLogger.ts        # Request/response logging
    │   └── validate.ts             # Request validation middleware
    │
    ├── routes/                     # API route definitions
    │   ├── authRoutes.ts           # /api/auth routes
    │   ├── chatRoutes.ts           # /api/chat routes
    │   ├── healthRoutes.ts         # /health route
    │   └── index.ts                # Route aggregation
    │
    ├── services/                   # Business logic layer
    │   ├── agentClient.ts          # Mock AI agent (to be replaced)
    │   ├── authService.ts          # Authentication business logic
    │   └── chatService.ts          # Chat business logic
    │
    ├── tests/                      # Test files
    │   ├── setup.ts                # Jest test setup
    │   ├── unit/                   # Unit tests
    │   │   ├── validation.test.ts  # Validation utility tests
    │   │   └── jwt.test.ts         # JWT utility tests
    │   └── integration/            # Integration tests
    │       ├── auth.integration.test.ts    # Auth flow tests
    │       └── chat.integration.test.ts    # Chat flow tests
    │
    ├── utils/                      # Utility functions and helpers
    │   ├── database.ts             # Prisma client singleton
    │   ├── errors.ts               # Custom error classes
    │   ├── jwt.ts                  # JWT token utilities
    │   ├── logger.ts               # Winston logger setup
    │   ├── response.ts             # Standardized response helpers
    │   └── validation.ts           # Joi validation schemas
    │
    ├── app.ts                      # Express app configuration
    └── server.ts                   # Application entry point
```

## Layer Responsibilities

### 1. Controllers (`src/controllers/`)

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Extract data from requests
- Call appropriate service methods
- Format responses using response utilities
- Should be thin - minimal logic

**Example**:
```typescript
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  sendSuccess(res, result);
});
```

### 2. Services (`src/services/`)

**Purpose**: Business logic and data manipulation

**Responsibilities**:
- Implement business rules
- Interact with database through Prisma
- Call external services (e.g., agentClient)
- Perform complex operations
- Throw appropriate errors

**Example**:
```typescript
export async function login(data: LoginData): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');
  // ... business logic
  return { user, accessToken, refreshToken };
}
```

### 3. Middleware (`src/middleware/`)

**Purpose**: Request/response processing pipeline

**Responsibilities**:
- Authentication & authorization
- Request validation
- Error handling
- Rate limiting
- Logging

**Example**:
```typescript
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const decoded = verifyAccessToken(token);
  req.user = decoded;
  next();
}
```

### 4. Routes (`src/routes/`)

**Purpose**: API endpoint definitions

**Responsibilities**:
- Define HTTP routes
- Apply middleware
- Map routes to controllers

**Example**:
```typescript
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);
```

### 5. Utils (`src/utils/`)

**Purpose**: Reusable helper functions

**Responsibilities**:
- JWT operations
- Database connection
- Error handling
- Logging
- Validation
- Response formatting

### 6. Config (`src/config/`)

**Purpose**: Centralized configuration

**Responsibilities**:
- Load environment variables
- Provide typed configuration
- Validate required settings

## File Descriptions

### Root Level Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `.eslintrc.json` | ESLint code quality rules |
| `.gitignore` | Files/folders to ignore in Git |
| `.prettierrc.json` | Code formatting configuration |
| `jest.config.js` | Test framework configuration |
| `nodemon.json` | Development auto-reload settings |
| `package.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript compiler options |
| `README.md` | Main project documentation |

### Configuration Files

| File | Purpose |
|------|---------|
| `src/config/index.ts` | Environment variable management |

### Controllers

| File | Endpoints |
|------|-----------|
| `authController.ts` | register, login, refresh, getMe, logout |
| `chatController.ts` | sendMessage, getHistory, getConversation, createConversation, deleteConversation, deleteMessage |
| `healthController.ts` | healthCheck |

### Services

| File | Purpose |
|------|---------|
| `authService.ts` | User authentication, token management, account security |
| `chatService.ts` | Conversation and message management |
| `agentClient.ts` | Mock AI responses (to be replaced with real service) |

### Middleware

| File | Purpose |
|------|---------|
| `auth.ts` | JWT verification, role-based access control |
| `errorHandler.ts` | Global error handling, error response formatting |
| `rateLimiter.ts` | Request rate limiting configurations |
| `requestLogger.ts` | HTTP request/response logging |
| `validate.ts` | Request payload validation |

### Routes

| File | Base Path | Purpose |
|------|-----------|---------|
| `authRoutes.ts` | `/api/auth` | Authentication endpoints |
| `chatRoutes.ts` | `/api/chat` | Chat endpoints |
| `healthRoutes.ts` | `/health` | Health check |
| `index.ts` | `/api` | Route aggregation |

### Utilities

| File | Purpose |
|------|---------|
| `database.ts` | Prisma client singleton, connection management |
| `errors.ts` | Custom error classes, error codes |
| `jwt.ts` | Token generation and verification |
| `logger.ts` | Winston logger configuration |
| `response.ts` | Standardized response helpers |
| `validation.ts` | Joi validation schemas |

### Tests

| File | Purpose |
|------|---------|
| `setup.ts` | Jest configuration for tests |
| `unit/validation.test.ts` | Validation utility tests |
| `unit/jwt.test.ts` | JWT utility tests |
| `integration/auth.integration.test.ts` | Auth API tests |
| `integration/chat.integration.test.ts` | Chat API tests |

## Data Flow

### Request Flow

```
Client Request
    ↓
Express App (app.ts)
    ↓
Middleware Pipeline
    ├── Security (helmet, cors)
    ├── Body Parsing
    ├── Request ID
    ├── Request Logger
    ├── Rate Limiter
    └── Route-specific middleware
        ├── Authentication
        ├── Validation
        └── Authorization
    ↓
Route Handler
    ↓
Controller
    ↓
Service Layer
    ├── Business Logic
    ├── Database (Prisma)
    └── External Services (agentClient)
    ↓
Response Formatting
    ↓
Client Response
```

### Error Flow

```
Error Thrown
    ↓
Caught by asyncHandler or next(error)
    ↓
Global Error Handler (errorHandler.ts)
    ├── Log Error (logger.ts)
    ├── Format Error Response
    └── Send HTTP Response
    ↓
Client receives error
```

## Database Schema

Located in `prisma/schema.prisma`:

### Models

1. **User**
   - Authentication data
   - Profile information
   - Security fields (login attempts, lockout)

2. **Conversation**
   - User conversations
   - Metadata (title, timestamps)
   - Relation to messages

3. **Message**
   - Chat messages
   - Role (user/assistant)
   - Content and format
   - Metadata

4. **RefreshToken**
   - JWT refresh tokens
   - Expiry and revocation

## Environment Variables

All environment variables are:
1. Loaded in `src/config/index.ts`
2. Validated at startup
3. Typed for safety
4. Used throughout the application

Critical variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `CORS_ORIGIN` - Allowed frontend origin

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start development server with hot reload |
| `build` | Compile TypeScript to JavaScript |
| `start` | Start production server |
| `test` | Run all tests with coverage |
| `test:watch` | Run tests in watch mode |
| `test:integration` | Run integration tests only |
| `lint` | Check code for linting errors |
| `lint:fix` | Fix linting errors automatically |
| `format` | Format code with Prettier |
| `prisma:generate` | Generate Prisma client |
| `prisma:migrate` | Run database migrations (dev) |
| `prisma:migrate:prod` | Run migrations (production) |
| `prisma:studio` | Open Prisma Studio GUI |
| `prisma:seed` | Seed database with sample data |

## Design Patterns

### 1. Singleton Pattern
- **Database connection** (`src/utils/database.ts`)
- **Logger** (`src/utils/logger.ts`)

### 2. Factory Pattern
- **Rate limiters** (`src/middleware/rateLimiter.ts`)
- **Error classes** (`src/utils/errors.ts`)

### 3. Middleware Pattern
- Express middleware pipeline
- Request processing chain

### 4. Service Layer Pattern
- Business logic separation
- Controllers → Services → Database

### 5. Repository Pattern (via Prisma)
- Database abstraction
- Type-safe queries

## Security Layers

1. **Network Layer**
   - CORS (configured in app.ts)
   - Helmet security headers
   - Rate limiting

2. **Authentication Layer**
   - JWT tokens
   - Bcrypt password hashing
   - Token rotation

3. **Authorization Layer**
   - Role-based access control
   - Resource ownership verification

4. **Input Validation**
   - Joi schemas
   - Sanitization
   - Type checking

5. **Database Layer**
   - Parameterized queries (Prisma)
   - SQL injection prevention

## Extension Points

### Adding New Endpoints

1. Create validation schema in `src/utils/validation.ts`
2. Implement service function in appropriate service file
3. Create controller function in appropriate controller
4. Add route in appropriate route file
5. Add tests in `src/tests/`

### Adding New Features

1. Design data models in `prisma/schema.prisma`
2. Create migration
3. Implement service layer
4. Add controllers and routes
5. Add middleware if needed
6. Write tests
7. Update documentation

### Replacing Mock Agent

1. Update `src/services/agentClient.ts`
2. Implement `sendMessageToRealAgent()` function
3. Update configuration for agent service URL
4. Test integration
5. Update chat service to use new implementation

## Best Practices

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **DRY Principle**: Reusable utilities and helpers
3. **Type Safety**: TypeScript strict mode enabled
4. **Error Handling**: Centralized error management
5. **Logging**: Comprehensive logging at all levels
6. **Testing**: Unit and integration tests
7. **Documentation**: Code comments and external docs
8. **Security**: Multiple security layers
9. **Scalability**: Stateless design, database pooling
10. **Maintainability**: Clean code, consistent style

## Development Workflow

1. **Make Changes**: Edit files in `src/`
2. **Test Locally**: `npm run dev`
3. **Run Tests**: `npm test`
4. **Lint Code**: `npm run lint:fix`
5. **Format Code**: `npm run format`
6. **Build**: `npm run build`
7. **Deploy**: Follow deployment guide

## Common Tasks

### Add New API Endpoint

```typescript
// 1. Add validation schema (src/utils/validation.ts)
export const newFeatureSchema = Joi.object({ /* ... */ });

// 2. Add service function (src/services/chatService.ts)
export async function newFeature(data: NewFeatureData) { /* ... */ }

// 3. Add controller (src/controllers/chatController.ts)
export const newFeature = asyncHandler(async (req, res) => { /* ... */ });

// 4. Add route (src/routes/chatRoutes.ts)
router.post('/new-feature', validateBody(newFeatureSchema), chatController.newFeature);
```

### Add Database Model

```prisma
// 1. Update schema (prisma/schema.prisma)
model NewModel {
  id String @id @default(uuid())
  // ... fields
}

// 2. Create migration
// npm run prisma:migrate

// 3. Use in service
await prisma.newModel.create({ data: { /* ... */ } });
```

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check `DATABASE_URL` in `.env`
   - Verify PostgreSQL is running
   - Run `npx prisma db pull` to test

2. **TypeScript errors**
   - Run `npm run build` to see all errors
   - Check `tsconfig.json` settings

3. **Tests failing**
   - Check test database connection
   - Review `src/tests/setup.ts`

4. **Port already in use**
   - Change `PORT` in `.env`
   - Kill process using the port

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Winston Logging](https://github.com/winstonjs/winston)
