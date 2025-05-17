const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { deleteUser } = require('../controllers/userController');

// Delete user route (admin only)
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router; 