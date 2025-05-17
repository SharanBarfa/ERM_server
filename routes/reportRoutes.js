import express from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport
} from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.route('/')
  .get(protect, getReports)
  .post(protect, createReport);

router.route('/:id')
  .get(protect, getReportById)
  .put(protect, updateReport)
  .delete(protect, deleteReport);

router.route('/:id/generate')
  .post(protect, generateReport);

export default router;
