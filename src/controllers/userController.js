const User = require('../models/User');
const Employee = require('../models/Employee');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Delete user and associated employee record
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // If user has an employee record, delete it first
  if (user.employee) {
    await Employee.findByIdAndDelete(user.employee);
  }

  // Delete the user
  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 