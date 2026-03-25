import express from 'express';
import {
  validateToken,
  getTokenInfo,
  submitTokenResponse,
  rejectTokenResponse,
  getMailTokenStats,
  getMailResponses
} from '../controllers/tokenController.js';
import {
  validateMailToken,
  validateTokenAction,
  ensureTokenNotUsed,
  rateLimitTokenValidation,
  logTokenAccess,
  extractClientInfo,
  tokenErrorHandler
} from '../middleware/tokenAuth.js';

const router = express.Router();

// Apply rate limiting and logging to all token routes
router.use(rateLimitTokenValidation);
router.use(extractClientInfo);
router.use(logTokenAccess);

/**
 * Public token validation routes - no authentication required
 */

// Validate token without consuming it
router.get('/validate/:token', validateToken);

// Get detailed token information
router.get('/info/:token', validateMailToken, getTokenInfo);

/**
 * Token action routes - require valid token
 */

// Submit response using token (handles both accept and reject)
router.post(
  '/:token/submit',
  validateMailToken,
  ensureTokenNotUsed,
  submitTokenResponse
);

// Simple rejection endpoint
router.post(
  '/:token/reject',
  validateMailToken,
  validateTokenAction('reject'),
  ensureTokenNotUsed,
  rejectTokenResponse
);

/**
 * Admin routes for token statistics and responses
 * Note: These should be protected by admin authentication in production
 * For now, they're public but could be easily protected by adding auth middleware
 */

// Get statistics for a specific mail
router.get('/mail/:mailId/stats', getMailTokenStats);

// Get all responses for a specific mail
router.get('/mail/:mailId/responses', getMailResponses);

/**
 * Health check route for token service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply error handler to all routes
router.use(tokenErrorHandler);

export default router;