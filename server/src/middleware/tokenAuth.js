import MailToken from '../models/mailToken.js';

/**
 * Middleware to validate mail tokens and set request context
 * This middleware validates tokens without consuming them
 */
export const validateMailToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Find and validate token
    const tokenRecord = await MailToken.findValidToken(token);

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or already used token'
      });
    }

    // Set request context for subsequent handlers
    req.mailToken = tokenRecord;
    req.mail = tokenRecord.mailId;
    req.recipientEmail = tokenRecord.recipientEmail;

    next();
  } catch (error) {
    console.error('Token validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token validation failed'
    });
  }
};

/**
 * Middleware to validate token and ensure it matches a specific action
 * @param {string} requiredAction - The required action ('accept' or 'reject')
 */
export const validateTokenAction = (requiredAction) => {
  return (req, res, next) => {
    if (!req.mailToken) {
      return res.status(500).json({
        success: false,
        message: 'Token validation middleware must run first'
      });
    }

    if (req.mailToken.action !== requiredAction) {
      return res.status(400).json({
        success: false,
        message: `This token is for ${req.mailToken.action}, not ${requiredAction}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if token has already been used
 * This is an additional check that can be used for extra security
 */
export const ensureTokenNotUsed = (req, res, next) => {
  if (!req.mailToken) {
    return res.status(500).json({
      success: false,
      message: 'Token validation middleware must run first'
    });
  }

  if (!req.mailToken.isTokenValid) {
    return res.status(409).json({
      success: false,
      message: 'This invitation link has already been used'
    });
  }

  next();
};

/**
 * Rate limiting middleware for token endpoints
 * Simple implementation - could be enhanced with Redis for production
 */
const tokenAttempts = new Map();

export const rateLimitTokenValidation = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 50; // Max 50 attempts per 15 minutes per IP

  // Clean old entries
  for (const [ip, data] of tokenAttempts.entries()) {
    if (now - data.firstAttempt > windowMs) {
      tokenAttempts.delete(ip);
    }
  }

  const clientAttempts = tokenAttempts.get(clientIp);

  if (!clientAttempts) {
    tokenAttempts.set(clientIp, {
      count: 1,
      firstAttempt: now
    });
  } else {
    clientAttempts.count++;

    if (clientAttempts.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many token validation attempts. Please try again later.'
      });
    }
  }

  next();
};

/**
 * Middleware to log token usage for audit trail
 */
export const logTokenAccess = (req, res, next) => {
  const { token } = req.params;
  const userAgent = req.get('User-Agent');
  const ipAddress = req.ip || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  // Only log if there's actually a token (skip for health checks, etc.)
  if (token) {
    console.log(`[${timestamp}] Token Access - Token: ${token.substring(0, 8)}..., IP: ${ipAddress}, UA: ${userAgent?.substring(0, 100)}`);
  }

  next();
};

/**
 * Middleware to extract and validate client information
 */
export const extractClientInfo = (req, res, next) => {
  // Extract client information for audit trail
  req.clientInfo = {
    userAgent: req.get('User-Agent') || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    timestamp: new Date(),
    referer: req.get('Referer') || null,
    origin: req.get('Origin') || null
  };

  next();
};

/**
 * Error handler specifically for token-related errors
 */
export const tokenErrorHandler = (error, req, res, next) => {
  console.error('Token middleware error:', error);

  // Handle specific MongoDB/Mongoose errors
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid token format'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Token validation failed'
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    message: 'Internal server error during token processing'
  });
};