import express from 'express';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByEmployee,
  updateTaskStatus
} from '../controllers/taskController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Task routes
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, admin, deleteTask);

router.route('/:id/status')
  .put(protect, updateTaskStatus);

router.route('/project/:projectId')
  .get(protect, getTasksByProject);

router.route('/employee/:employeeId')
  .get(protect, getTasksByEmployee);

export default router;
