import Project from '../models/Project.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email position'
        }
      });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name');

    res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email position'
        }
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update project progress
// @route   PUT /api/projects/:id/progress
// @access  Private/Admin
export const updateProjectProgress = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { progress: req.body.progress } },
      { new: true, runValidators: true }
    )
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get projects by department
// @route   GET /api/projects/department/:departmentId
// @access  Private
export const getProjectsByDepartment = async (req, res) => {
  try {
    const projects = await Project.find({ department: req.params.departmentId })
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name');

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get projects by manager
// @route   GET /api/projects/manager/:managerId
// @access  Private
export const getProjectsByManager = async (req, res) => {
  try {
    const projects = await Project.find({ manager: req.params.managerId })
      .populate('manager', 'firstName lastName email position')
      .populate('team', 'name')
      .populate('department', 'name');

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
