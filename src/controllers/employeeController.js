const Employee = require('../models/Employee');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = asyncHandler(async (req, res, next) => {
  let user;
  
  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create user account first
    user = await User.create({
      name: `${req.body.firstName} ${req.body.lastName}`,
      email: req.body.email,
      password: req.body.password,
      role: 'employee'
    });

    // Create employee record with user reference
    const employee = await Employee.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      position: req.body.position,
      joinDate: req.body.joinDate || new Date(),
      status: req.body.status || 'active',
      user: user._id,
      address: req.body.address || {},
      emergencyContact: req.body.emergencyContact || {}
    });

    // Update user with employee reference
    user.employee = employee._id;
    await user.save();

    // Populate the response with department and user info
    const populatedEmployee = await Employee.findById(employee._id)
      .populate('department', 'name')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    // If employee creation fails, delete the user account
    if (user) {
      await User.findByIdAndDelete(user._id);
    }
    
    return next(new ErrorResponse(
      error.message || 'Error creating employee record',
      error.statusCode || 400
    ));
  }
});

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
exports.getEmployees = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find()
    .populate('department', 'name')
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: employees
  });
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private/Admin
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name')
    .populate('user', 'name email');

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  // Delete associated user account
  if (employee.user) {
    await User.findByIdAndDelete(employee.user);
  }

  // Delete employee record
  await employee.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 