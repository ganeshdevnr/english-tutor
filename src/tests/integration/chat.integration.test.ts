import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { prisma } from '../../utils/database';

describe('Chat Integration Tests', () => {
  let app: Application;
  let accessToken: string;
  let userId: string;

  const testUser = {
    email: 'chattest@example.com',
    password: 'Password123!',
    name: 'Chat Test User',
  };

  beforeAll(async () => {
    app = createApp();

    // Register user and get token
    const response = await request(app).post('/api/auth/register').send(testUser);

    accessToken = response.body.data.accessToken;
    userId = response.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/chat/message', () => {
    it('should send message and create new conversation', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Hello, I want to learn English!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversationId).toBeDefined();
      expect(response.body.data.userMessage).toBeDefined();
      expect(response.body.data.userMessage.role).toBe('user');
      expect(response.body.data.assistantMessage).toBeDefined();
      expect(response.body.data.assistantMessage.role).toBe('assistant');
      expect(response.body.data.assistantMessage.content).toBeTruthy();
    });

    it('should send message to existing conversation', async () => {
      // First message
      const firstResponse = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'First message' });

      const conversationId = firstResponse.body.data.conversationId;

      // Second message to same conversation
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          message: 'Second message',
          conversationId,
        })
        .expect(201);

      expect(response.body.data.conversationId).toBe(conversationId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .send({ message: 'Test message' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty message', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return context-aware response for code request', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Can you show me a code example?' })
        .expect(201);

      expect(response.body.data.assistantMessage.content).toContain('```');
      expect(response.body.data.assistantMessage.format).toBe('markdown');
    });
  });

  describe('GET /api/chat/history', () => {
    beforeAll(async () => {
      // Create some conversations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/chat/message')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ message: `Test message ${i}` });
      }
    });

    it('should get conversation history', async () => {
      const response = await request(app)
        .get('/api/chat/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/chat/history?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/chat/history').expect(401);
    });
  });

  describe('GET /api/chat/conversations/:conversationId', () => {
    let conversationId: string;

    beforeAll(async () => {
      // Create a conversation
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Test conversation' });

      conversationId = response.body.data.conversationId;
    });

    it('should get conversation with messages', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(conversationId);
      expect(response.body.data.messages).toBeInstanceOf(Array);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid conversation ID format', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/chat/conversations', () => {
    it('should create new conversation', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'My Custom Conversation' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('My Custom Conversation');
      expect(response.body.data.messages).toBeInstanceOf(Array);
    });

    it('should create conversation with first message', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Conversation',
          firstMessage: 'Hello!',
        })
        .expect(201);

      expect(response.body.data.messages.length).toBe(1);
      expect(response.body.data.messages[0].content).toBe('Hello!');
    });
  });

  describe('DELETE /api/chat/conversations/:conversationId', () => {
    let conversationId: string;

    beforeEach(async () => {
      // Create a conversation to delete
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'To be deleted' });

      conversationId = response.body.data.conversationId;
    });

    it('should delete conversation', async () => {
      await request(app)
        .delete(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify deletion
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent conversation', async () => {
      await request(app)
        .delete('/api/chat/conversations/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/chat/messages/:messageId', () => {
    let messageId: string;

    beforeEach(async () => {
      // Create a message to delete
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Message to delete' });

      messageId = response.body.data.userMessage.id;
    });

    it('should delete message', async () => {
      await request(app)
        .delete(`/api/chat/messages/${messageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent message', async () => {
      await request(app)
        .delete('/api/chat/messages/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
