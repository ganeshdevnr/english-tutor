# Quick Start Guide

Get the English Tutor Backend up and running in 5 minutes.

## Prerequisites

Make sure you have installed:
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Git

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Minimum required: DATABASE_URL, JWT secrets
```

**Important**: Update these variables in `.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/english_tutor

JWT_ACCESS_SECRET=your-strong-random-secret-here
JWT_REFRESH_SECRET=your-different-strong-random-secret-here
```

**Generate Strong Secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Set Up Database

```bash
# Create database (PostgreSQL must be running)
createdb english_tutor

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:8000`

## Verify Installation

### 1. Check Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": { "status": "connected" }
  }
}
```

### 2. Register a User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

### 3. Send a Chat Message

```bash
# Use the accessToken from registration response
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "Hello, I want to learn English!"
  }'
```

## Sample Data

If you ran the seed script, you have:

**Demo User**:
- Email: `demo@example.com`
- Password: `Password123!`

**Admin User**:
- Email: `admin@example.com`
- Password: `Admin123!`

## Development Tools

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Next Steps

1. **Explore the API**: Check `docs/API_DOCUMENTATION.md`
2. **Read the Architecture**: See `docs/PROJECT_STRUCTURE.md`
3. **Deploy**: Follow `docs/DEPLOYMENT.md`

## Common Issues

### Database Connection Error

**Problem**: `Error: Can't reach database server`

**Solution**:
1. Make sure PostgreSQL is running:
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql

   # Windows
   # Use pgAdmin or Services
   ```

2. Verify your `DATABASE_URL` in `.env`

### Port Already in Use

**Problem**: `Error: Port 8000 is already in use`

**Solution**:
1. Change port in `.env`:
   ```env
   PORT=8001
   ```

2. Or kill the process:
   ```bash
   # Find process
   lsof -ti:8000

   # Kill it
   kill -9 $(lsof -ti:8000)
   ```

### Prisma Migration Error

**Problem**: Migration fails

**Solution**:
```bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Or create new database
createdb english_tutor_new
# Update DATABASE_URL and run migrations again
```

### JWT Token Error

**Problem**: `Invalid token` errors

**Solution**:
1. Make sure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
2. They should be different values
3. They should be at least 32 characters long

## API Testing with Postman

1. Import the collection (if available)
2. Set environment variables:
   - `baseUrl`: `http://localhost:8000`
   - `accessToken`: (from login response)

## Development Workflow

```bash
# 1. Start dev server (with auto-reload)
npm run dev

# 2. Make changes to code in src/

# 3. Test your changes
npm test

# 4. Check code quality
npm run lint:fix
npm run format

# 5. Build for production
npm run build

# 6. Start production server
npm start
```

## Project Structure (Quick Reference)

```
src/
├── controllers/    # Request handlers
├── services/       # Business logic
├── routes/         # API routes
├── middleware/     # Express middleware
├── utils/          # Helper functions
└── config/         # Configuration
```

## Important Files

- `.env` - Environment variables
- `prisma/schema.prisma` - Database schema
- `src/server.ts` - Application entry point
- `src/app.ts` - Express configuration
- `package.json` - Dependencies and scripts

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Check code quality
npm run format       # Format code
```

## Getting Help

- **Documentation**: See `README.md` and files in `docs/`
- **API Reference**: `docs/API_DOCUMENTATION.md`
- **Issues**: Check the repository issues

## What's Next?

- [ ] Set up your frontend to connect to this API
- [ ] Replace mock agent with real AI service
- [ ] Configure production environment
- [ ] Set up monitoring and logging
- [ ] Deploy to production (see `docs/DEPLOYMENT.md`)

## Tips

1. **Use Prisma Studio** to visualize and edit database data
2. **Check logs** in `logs/app.log` for debugging
3. **Use the health endpoint** to verify everything is working
4. **Read the tests** to understand how the API works
5. **Keep your `.env` secure** - never commit it to Git

## Support

If you encounter issues:
1. Check this guide
2. Review error messages in logs
3. Consult the full documentation
4. Open an issue on the repository

Happy coding!
