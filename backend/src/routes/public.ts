import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { validate } from '../middleware/validate';
import { listOpenEvents } from '../services/events';
import { register } from '../services/registrations';
import { registerSchema } from '../validation/schemas';

// Express 5 forwards a rejected async handler to the error middleware, so no try/catch here.
const router = Router();

// see docs/adr/0009: 10000/min/IP, off by default so no automated run ever sees a 429.
const registerLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: 'Too many requests, try again shortly.' });
  },
});

router.get('/events', async (_req, res) => {
  res.status(200).json(await listOpenEvents());
});

if (config.rateLimitEnabled) {
  router.use('/register', registerLimiter);
}

router.post('/register', async (req, res) => {
  const { eventUuid, emailAddress } = validate(registerSchema, req.body);
  res.status(200).json({ registrationNo: await register(eventUuid, emailAddress) });
});

export default router;
