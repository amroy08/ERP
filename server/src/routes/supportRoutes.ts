import { Router } from 'express';
import { createTicket, getTickets } from '../controllers/supportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/tickets', createTicket);
router.get('/tickets', getTickets);

export default router;
