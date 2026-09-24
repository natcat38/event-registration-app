import { Router } from 'express';
import { validate } from '../middleware/validate';
import { listAdminEvents } from '../services/adminEvents';
import { createEvent, listHandlers } from '../services/events';
import { getEventTrend } from '../services/trend';
import { adminEventsQuerySchema, createEventSchema, uuidParamSchema } from '../validation/schemas';

// Express 5 forwards a rejected async handler to the error middleware, so no try/catch here.
const router = Router();

router.get('/events', async (req, res) => {
  const query = validate(adminEventsQuerySchema, req.query);
  res.status(200).json(await listAdminEvents(query));
});

router.post('/events', async (req, res) => {
  await createEvent(validate(createEventSchema, req.body));
  res.status(200).end(); // the spec says the response is nil
});

// The spec defines this as POST with no body.
router.post('/events/:uuid/trend', async (req, res) => {
  const { uuid } = validate(uuidParamSchema, req.params);
  res.status(200).json(await getEventTrend(uuid));
});

// Not in the spec's own table; needed for the admin form's handler dropdown. see docs/adr/0008
router.get('/handlers', async (_req, res) => {
  res.status(200).json(await listHandlers());
});

export default router;
