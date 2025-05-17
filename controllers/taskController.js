import Task from '../models/Task.js';
import Project from '../models/Project.js';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    // Add the current user as the creator
    req.body.createdBy = req.user._id;

    const task = await Task.create(req.body);
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a status'
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status,
          completedAt: status === 'completed' ? Date.now() : null
        } 
      },
      { new: true, runValidators: true }
    )
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // If the task is completed, update the project progress
    if (status === 'completed') {
      // Get all tasks for this project
      const projectTasks = await Task.find({ project: task.project._id });
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const totalTasks = projectTasks.length;
      
      // Calculate progress percentage
      const progress = Math.round((completedTasks / totalTasks) * 100);
      
      // Update project progress
      await Project.findByIdAndUpdate(
        task.project._id,
        { $set: { progress } }
      );
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get tasks by project
// @route   GET /api/tasks/project/:projectId
// @access  Private
export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get tasks by employee
// @route   GET /api/tasks/employee/:employeeId
// @access  Private
export const getTasksByEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.employeeId })
      .populate('project', 'name status')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
