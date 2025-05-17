import User from '../models/userModel.js';
import Employee from '../models/employeeModel.js';
import Department from '../models/departmentModel.js';
import { generateToken } from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeData } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user with basic information
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee'
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      // If role is employee, create employee record
      let employee = null;
      if (role === 'employee' && employeeData) {
        try {
          // Get the department information
          const departmentInfo = await Department.findById(employeeData.department);

          if (!departmentInfo) {
            return res.status(400).json({
              success: false,
              error: 'Invalid department selected'
            });
          }

          // Generate a unique employee ID based on department and count
          const departmentPrefix = departmentInfo.name.substring(0, 3).toUpperCase();
          const employeeCount = await Employee.countDocuments();
          const employeeId = `${departmentPrefix}${String(employeeCount + 1).padStart(4, '0')}`;

          // Create employee record
          employee = await Employee.create({
            user: user._id, // Link to user
            employeeId,
            firstName: employeeData.firstName || name.split(' ')[0],
            lastName: employeeData.lastName || name.split(' ').slice(1).join(' '),
            email: email,
            phone: employeeData.phone || '',
            department: employeeData.department,
            position: employeeData.position || 'Staff',
            joinDate: employeeData.joinDate || new Date(),
            status: employeeData.status || 'active',
            address: {
              street: employeeData.address?.street || '',
              city: employeeData.address?.city || '',
              state: employeeData.address?.state || '',
              zipCode: employeeData.address?.zipCode || '',
              country: employeeData.address?.country || ''
            },
            emergencyContact: {
              name: employeeData.emergencyContact?.name || '',
              relationship: employeeData.emergencyContact?.relationship || '',
              phone: employeeData.emergencyContact?.phone || ''
            }
          });

          // Update user with department and position
          user.department = employeeData.department;
          user.position = employeeData.position;
          await user.save();
        } catch (empError) {
          console.error('Error creating employee record:', empError);
          // If employee creation fails, delete the user
          await user.deleteOne();
          return res.status(500).json({
            success: false,
            error: 'Error creating employee record'
          });
        }
      }

      // Return response with employee data if available
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employee: employee ? {
            _id: employee._id,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            department: employee.department,
            position: employee.position,
            joinDate: employee.joinDate,
            address: employee.address,
            emergencyContact: employee.emergencyContact
          } : null,
          token
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get employee data if exists
    let employeeData = null;
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ user: user._id })
        .populate('department', 'name')
        .populate('attendance');

      if (employee) {
        employeeData = {
          _id: employee._id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
          email: employee.email,
          phone: employee.phone,
          position: employee.position,
          department: employee.department,
          status: employee.status,
          joinDate: employee.joinDate,
          address: employee.address,
          emergencyContact: employee.emergencyContact,
          profileImage: employee.profileImage,
          attendance: employee.attendance,
        };
      }
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: employeeData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get employee data if exists
    let employeeData = null;
    const employee = await Employee.findOne({ user: user._id }).populate('department', 'name');

    if (employee) {
      // Make sure department is populated
      await employee.populate('department', 'name');

      employeeData = {
        _id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        status: employee.status,
        joinDate: employee.joinDate,
        address: employee.address,
        emergencyContact: employee.emergencyContact,
        profileImage: employee.profileImage
      };

      console.log('Employee data for profile response:', {
        employeeId: employeeData.employeeId,
        joinDate: employeeData.joinDate,
        department: employeeData.department?.name
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        employee: employeeData
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profileImage = req.body.profileImage || user.profileImage;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Generate token
    const token = generateToken(updatedUser._id);

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
