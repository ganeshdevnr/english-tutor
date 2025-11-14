import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);

// Health check is mounted at root level (not under /api)
export { healthRoutes };

export default router;
