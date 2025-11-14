# API Documentation

Complete API reference for the English Tutor Backend.

## Base URL

```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the access token in the Authorization header:

```
Authorization: Bearer <access-token>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

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

## Endpoints

### Authentication

#### Register New User

Create a new user account.

```http
POST /api/auth/register
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 8 chars, must contain uppercase, lowercase, number, and special character |
| name | string | Yes | User's full name (2-100 characters) |

**Example Request**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
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

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid input data
- `409 EMAIL_ALREADY_EXISTS` - Email already registered
- `429 RATE_LIMIT_EXCEEDED` - Too many registration attempts

---

#### Login

Authenticate user and receive tokens.

```http
POST /api/auth/login
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Example Request**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
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

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid input
- `401 INVALID_CREDENTIALS` - Wrong email or password
- `401 ACCOUNT_LOCKED` - Too many failed attempts
- `429 RATE_LIMIT_EXCEEDED` - Too many login attempts

---

#### Refresh Token

Get a new access token using a refresh token.

```http
POST /api/auth/refresh
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token |

**Example Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note**: The old refresh token is revoked and a new one is issued (token rotation).

**Error Responses**

- `400 VALIDATION_ERROR` - Missing refresh token
- `401 TOKEN_INVALID` - Invalid or revoked token
- `401 TOKEN_EXPIRED` - Refresh token expired

---

#### Get Current User

Get the authenticated user's profile.

```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-02T00:00:00.000Z"
  },
  "timestamp": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses**

- `401 UNAUTHORIZED` - Missing or invalid token
- `404 USER_NOT_FOUND` - User not found

---

#### Logout

Logout user and revoke refresh token.

```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Refresh token to revoke |

**Example Request**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (204 No Content)**

No response body.

**Error Responses**

- `401 UNAUTHORIZED` - Missing or invalid access token

---

### Chat

All chat endpoints require authentication.

#### Send Message

Send a message and receive AI response.

```http
POST /api/chat/message
Authorization: Bearer <access-token>
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User message (1-10000 characters) |
| conversationId | string | No | UUID of existing conversation |

**Example Request**

```json
{
  "message": "Hello, I want to learn English grammar!",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

If `conversationId` is not provided, a new conversation is created.

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "userMessage": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "Hello, I want to learn English grammar!",
      "format": "text",
      "status": "sent",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "metadata": null
    },
    "assistantMessage": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "conversationId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "Grammar is the foundation of effective communication...",
      "format": "markdown",
      "status": "sent",
      "timestamp": "2024-01-01T00:00:01.000Z",
      "metadata": {
        "model": "mock-agent-v1",
        "tokens": 42,
        "processingTime": 850
      }
    }
  },
  "timestamp": "2024-01-01T00:00:01.000Z"
}
```

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid message or conversation ID
- `401 UNAUTHORIZED` - Missing or invalid token
- `403 FORBIDDEN` - Conversation belongs to another user
- `404 CONVERSATION_NOT_FOUND` - Conversation ID not found
- `429 RATE_LIMIT_EXCEEDED` - Too many messages

---

#### Get Conversation History

Get list of user's conversations.

```http
GET /api/chat/history?page=1&limit=20
Authorization: Bearer <access-token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (min: 1) |
| limit | integer | 20 | Items per page (min: 1, max: 100) |

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "440e8400-e29b-41d4-a716-446655440000",
      "title": "Learning English Grammar",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "440e8400-e29b-41d4-a716-446655440000",
      "title": "Vocabulary Practice",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  },
  "timestamp": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid pagination parameters
- `401 UNAUTHORIZED` - Missing or invalid token

---

#### Get Specific Conversation

Get a conversation with all messages.

```http
GET /api/chat/conversations/:conversationId
Authorization: Bearer <access-token>
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversationId | string (UUID) | Conversation ID |

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "440e8400-e29b-41d4-a716-446655440000",
    "title": "Learning English Grammar",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:30:00.000Z",
    "messages": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "conversationId": "550e8400-e29b-41d4-a716-446655440000",
        "role": "user",
        "content": "Teach me about present tense",
        "format": "text",
        "status": "sent",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "metadata": null
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "conversationId": "550e8400-e29b-41d4-a716-446655440000",
        "role": "assistant",
        "content": "Present tense is used to describe...",
        "format": "markdown",
        "status": "sent",
        "timestamp": "2024-01-01T00:00:01.000Z",
        "metadata": {
          "model": "mock-agent-v1",
          "tokens": 35
        }
      }
    ]
  },
  "timestamp": "2024-01-01T00:30:00.000Z"
}
```

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid conversation ID format
- `401 UNAUTHORIZED` - Missing or invalid token
- `403 FORBIDDEN` - Conversation belongs to another user
- `404 CONVERSATION_NOT_FOUND` - Conversation not found

---

#### Create New Conversation

Create a new empty conversation or with first message.

```http
POST /api/chat/conversations
Authorization: Bearer <access-token>
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Conversation title (1-200 characters) |
| firstMessage | string | No | First message (1-10000 characters) |

**Example Request**

```json
{
  "title": "English Pronunciation Practice",
  "firstMessage": "I need help with pronunciation"
}
```

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "440e8400-e29b-41d4-a716-446655440000",
    "title": "English Pronunciation Practice",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "messages": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "conversationId": "550e8400-e29b-41d4-a716-446655440000",
        "role": "user",
        "content": "I need help with pronunciation",
        "format": "text",
        "status": "sent",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "metadata": null
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid input
- `401 UNAUTHORIZED` - Missing or invalid token

---

#### Delete Conversation

Delete a conversation and all its messages.

```http
DELETE /api/chat/conversations/:conversationId
Authorization: Bearer <access-token>
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversationId | string (UUID) | Conversation ID |

**Response (204 No Content)**

No response body.

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid conversation ID format
- `401 UNAUTHORIZED` - Missing or invalid token
- `403 FORBIDDEN` - Conversation belongs to another user
- `404 CONVERSATION_NOT_FOUND` - Conversation not found

---

#### Delete Message

Delete a specific message.

```http
DELETE /api/chat/messages/:messageId
Authorization: Bearer <access-token>
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| messageId | string (UUID) | Message ID |

**Response (204 No Content)**

No response body.

**Error Responses**

- `400 VALIDATION_ERROR` - Invalid message ID format
- `401 UNAUTHORIZED` - Missing or invalid token
- `403 FORBIDDEN` - Message belongs to another user
- `404 MESSAGE_NOT_FOUND` - Message not found

---

### Health Check

#### Health Status

Check API and database health.

```http
GET /health
```

No authentication required.

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "english-tutor-backend",
    "version": "1.0.0",
    "environment": "production",
    "database": {
      "status": "connected"
    },
    "uptime": 123456.789
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (503 Service Unavailable)**

When database is not connected:

```json
{
  "success": true,
  "data": {
    "status": "unhealthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "english-tutor-backend",
    "version": "1.0.0",
    "environment": "production",
    "database": {
      "status": "disconnected"
    },
    "uptime": 123456.789
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| INVALID_INPUT | 400 | Malformed request |
| MISSING_REQUIRED_FIELD | 400 | Required field missing |
| UNAUTHORIZED | 401 | Not authenticated |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| TOKEN_EXPIRED | 401 | Access token expired |
| TOKEN_INVALID | 401 | Invalid token |
| ACCOUNT_LOCKED | 401 | Too many failed attempts |
| FORBIDDEN | 403 | Access denied |
| INSUFFICIENT_PERMISSIONS | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| USER_NOT_FOUND | 404 | User not found |
| CONVERSATION_NOT_FOUND | 404 | Conversation not found |
| MESSAGE_NOT_FOUND | 404 | Message not found |
| CONFLICT | 409 | Resource conflict |
| EMAIL_ALREADY_EXISTS | 409 | Email already registered |
| DUPLICATE_RESOURCE | 409 | Resource already exists |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| DATABASE_ERROR | 500 | Database operation failed |
| AGENT_SERVICE_ERROR | 500 | AI agent service error |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| POST /auth/register | 5 requests | 1 hour |
| POST /auth/login | 10 requests | 15 minutes |
| POST /chat/message | 30 requests | 1 minute |

Rate limit information is included in response headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

## Postman Collection

You can import the following Postman collection for easy API testing:

[Link to Postman collection would go here]

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('http://localhost:8000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!',
    name: 'John Doe'
  })
});

const { accessToken, refreshToken } = (await registerResponse.json()).data;

// 2. Use access token for authenticated requests
const profileResponse = await fetch('http://localhost:8000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. Refresh token when access token expires
const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken } = (await refreshResponse.json()).data;
```

### Send Message Flow

```javascript
// Send first message (creates new conversation)
const messageResponse = await fetch('http://localhost:8000/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    message: 'Hello, I want to learn English!'
  })
});

const { conversationId } = (await messageResponse.json()).data;

// Send follow-up message to same conversation
await fetch('http://localhost:8000/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    message: 'Can you help me with grammar?',
    conversationId
  })
});
```
