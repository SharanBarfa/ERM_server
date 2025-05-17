const Department = require('../models/Department');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.create(req.body);

  res.status(201).json({
    success: true,
    data: department
  });
});

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  const departments = await Department.find();

  res.status(200).json({
    success: true,
    data: departments
  });
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }

  await department.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 