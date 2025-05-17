import Employee from '../models/employeeModel.js';
import User from '../models/userModel.js';
import Department from '../models/departmentModel.js';
import Activity from '../models/activityModel.js';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    // Filter by status if provided
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Filter by department if provided
    if (req.query.department) {
      query.department = req.query.department;
    }
    
    // Search by name or position
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { position: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const employees = await Employee.find(query)
      .populate('department', 'name')
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Employee.countDocuments(query);
    
    res.json({
      success: true,
      count: employees.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .populate('user', 'name email');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      joinDate,
      status,
      salary,
      address,
      emergencyContact,
      password
    } = req.body;
    
    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Generate employee ID
    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP${(employeeCount + 1).toString().padStart(4, '0')}`;

    // Create user with all required fields
    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      password: password || 'Welcome@123',
      role: 'employee',
      department,
      position,
      phone,
      joinDate,
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || ''
      },
      emergencyContact: {
        name: emergencyContact?.name || '',
        relationship: emergencyContact?.relationship || '',
        phone: emergencyContact?.phone || ''
      }
    };

    const user = await User.create(userData);
    
    // Create employee record
    const employee = await Employee.create({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      joinDate,
      status,
      salary,
      address,
      emergencyContact,
      user: user._id // Link to the created user account
    });

    // Create activity log for new employee
    await Activity.create({
      type: 'new_employee',
      user: req.user.id,
      subject: 'New Employee Added',
      description: `New employee "${firstName} ${lastName}" (${employeeId}) has been added to ${departmentExists.name}`,
      relatedTo: {
        model: 'Employee',
        id: employee._id
      },
      metadata: {
        employeeName: `${firstName} ${lastName}`,
        employeeId,
        department: departmentExists.name,
        position
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...employee.toObject(),
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          emergencyContact: user.emergencyContact
        }
      },
      message: 'Employee created successfully with user account.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    // Update employee
    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // If department or position changed and user exists, update user as well
    if ((req.body.department || req.body.position) && employee.user) {
      const updateData = {};
      if (req.body.department) updateData.department = req.body.department;
      if (req.body.position) updateData.position = req.body.position;
      
      await User.findByIdAndUpdate(employee.user, updateData);
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'name email')
      .populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Store employee info for activity log
    const employeeInfo = {
      name: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.employeeId,
      department: employee.department?.name
    };

    // Delete the associated user account if it exists
    if (employee.user) {
      await User.findByIdAndDelete(employee.user._id);
    }

    // Create activity log for employee deletion
    await Activity.create({
      type: 'employee_update',
      user: req.user.id,
      subject: 'Employee Deleted',
      description: `Employee "${employeeInfo.name}" (${employeeInfo.employeeId}) has been deleted`,
      relatedTo: {
        model: 'Employee',
        id: employee._id
      },
      metadata: {
        employeeName: employeeInfo.name,
        employeeId: employeeInfo.employeeId,
        department: employeeInfo.department,
        action: 'delete'
      }
    });

    // Delete the employee
    await employee.deleteOne();

    res.json({
      success: true,
      data: {},
      message: 'Employee and associated user account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get employee stats
// @route   GET /api/employees/stats
// @access  Private
export const getEmployeeStats = async (req, res) => {
  try {
    // Get total employees
    const totalEmployees = await Employee.countDocuments();
    
    // Get active employees
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Get employees on leave
    const onLeaveEmployees = await Employee.countDocuments({ status: 'leave' });
    
    // Get new hires (joined in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = await Employee.countDocuments({
      joinDate: { $gte: thirtyDaysAgo }
    });
    
    // Get department distribution
    const departmentDistribution = await Employee.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: '$departmentInfo'
      },
      {
        $group: {
          _id: '$department',
          name: { $first: '$departmentInfo.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          count: 1,
          percentage: {
            $multiply: [{ $divide: ['$count', totalEmployees] }, 100]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalEmployees,
        active: activeEmployees,
        onLeave: onLeaveEmployees,
        newHires,
        departmentDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
