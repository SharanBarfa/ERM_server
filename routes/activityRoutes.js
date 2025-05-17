import express from 'express';
import { getRecentActivities, createActivity, getUserActivities } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get recent activities
router.get('/', protect, getRecentActivities);

// Create new activity
router.post('/', protect, createActivity);

// Get user activities
router.get('/user/:userId', protect, getUserActivities);

export default router; 