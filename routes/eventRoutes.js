import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getUpcomingEvents,
  getEventById, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createEvent)
  .get(protect, getEvents);

router.route('/upcoming')
  .get(protect, getUpcomingEvents);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, admin, updateEvent)
  .delete(protect, admin, deleteEvent);

export default router;