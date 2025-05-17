import express from 'express';
import {
  getAttendanceRecords,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.route('/')
  .get(protect, getAttendanceRecords)
  .post(protect, createAttendance);

router.route('/stats')
  .get(protect, getAttendanceStats);

router.route('/check-in')
  .post(protect, checkIn);

router.route('/check-out')
  .post(protect, checkOut);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, updateAttendance)
  .delete(protect, admin, deleteAttendance);

export default router;
