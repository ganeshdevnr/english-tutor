import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import healthRoutes from './healthRoutes';
import llmRoutes from './llmRoutes';

const router = Router();

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/llm', llmRoutes); // LLM service endpoints (no authentication)

// Health check is mounted at root level (not under /api)
export { healthRoutes };

export default router;
