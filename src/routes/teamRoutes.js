const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));

// Team routes
router.route('/')
  .get(teamController.getTeams)
  .post(teamController.createTeam);

router.route('/:id')
  .get(teamController.getTeamById)
  .put(teamController.updateTeam)
  .delete(teamController.deleteTeam);

router.route('/:id/members')
  .post(teamController.addTeamMembers)
  .delete(teamController.removeTeamMembers);

module.exports = router; 