import express from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectProgress,
  getProjectsByDepartment,
  getProjectsByManager
} from '../controllers/projectController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Project routes
router.route('/')
  .get(protect, getProjects)
  .post(protect, admin, createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, admin, updateProject)
  .delete(protect, admin, deleteProject);

router.route('/:id/progress')
  .put(protect, admin, updateProjectProgress);

router.route('/department/:departmentId')
  .get(protect, getProjectsByDepartment);

router.route('/manager/:managerId')
  .get(protect, getProjectsByManager);

export default router;
