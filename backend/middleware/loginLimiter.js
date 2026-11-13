
import { rateLimit } from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,                // Maximum 10 attempts
    standardHeaders: 'draft-8',
    legacyHeaders: false,

    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    }
});

export default loginLimiter;
