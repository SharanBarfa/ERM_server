import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getEmployeeTeams
} from '../controllers/teamController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.route('/')
  .get(protect, getTeams)
  .post(protect, admin, createTeam);

router.route('/employee/:employeeId')
  .get(protect, getEmployeeTeams);

router.route('/:id')
  .get(protect, getTeamById)
  .put(protect, admin, updateTeam)
  .delete(protect, admin, deleteTeam);

router.route('/:id/members')
  .put(protect, admin, addTeamMember);

router.route('/:id/members/:employeeId')
  .delete(protect, admin, removeTeamMember);

export default router;
