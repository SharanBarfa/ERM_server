import Team from '../models/teamModel.js';
import Employee from '../models/employeeModel.js';
import Department from '../models/departmentModel.js';

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
export const getTeams = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }
    
    // Filter by leader
    if (req.query.leader) {
      query.leader = req.query.leader;
    }
    
    // Filter by member
    if (req.query.member) {
      query.members = req.query.member;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const teams = await Team.find(query)
      .populate('department', 'name')
      .populate('leader', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Team.countDocuments(query);
    
    res.json({
      success: true,
      count: teams.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('department', 'name')
      .populate('leader', 'firstName lastName employeeId')
      .populate('members', 'firstName lastName employeeId position')
      .populate('createdBy', 'name');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private/Admin
export const createTeam = async (req, res) => {
  try {
    const { name, description, department, leader, members, projects } = req.body;
    
    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Check if leader exists
    if (leader) {
      const leaderExists = await Employee.findById(leader);
      if (!leaderExists) {
        return res.status(404).json({
          success: false,
          error: 'Leader not found'
        });
      }
    }
    
    // Check if team name already exists
    const teamExists = await Team.findOne({ name });
    if (teamExists) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists'
      });
    }
    
    // Create team
    const team = await Team.create({
      name,
      description,
      department,
      leader,
      members: members || [],
      projects: projects || [],
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private/Admin
export const updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Update team
    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private/Admin
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    await team.deleteOne();
    
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

// @desc    Add member to team
// @route   PUT /api/teams/:id/members
// @access  Private/Admin
export const addTeamMember = async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide employee ID'
      });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    // Check if employee is already a member
    if (team.members.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Employee is already a member of this team'
      });
    }
    
    // Add member to team
    team.members.push(employeeId);
    await team.save();
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:employeeId
// @access  Private/Admin
export const removeTeamMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Check if employee is a member
    if (!team.members.includes(req.params.employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Employee is not a member of this team'
      });
    }
    
    // Remove member from team
    team.members = team.members.filter(
      member => member.toString() !== req.params.employeeId
    );
    
    await team.save();
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get teams for employee
// @route   GET /api/teams/employee/:employeeId
// @access  Private
export const getEmployeeTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 
      $or: [
        { leader: req.params.employeeId },
        { members: req.params.employeeId }
      ]
    })
    .populate('department', 'name')
    .populate('leader', 'firstName lastName')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
