const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks
exports.getTasks = async () => {
  try {
    const tasks = await Task.find()
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get tasks by project
exports.getTasksByProject = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId })
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get tasks by employee
exports.getTasksByEmployee = async (employeeId) => {
  try {
    const tasks = await Task.find({ assignedTo: employeeId })
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create a new task
exports.createTask = async (taskData) => {
  try {
    const task = await Task.create(taskData);
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');
    return { success: true, data: populatedTask };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update a task
exports.updateTask = async (taskId, updateData) => {
  try {
    // If status is being updated to completed, set completedAt
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = Date.now();
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');

    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a task
exports.deleteTask = async (taskId) => {
  try {
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get task by ID
exports.getTaskById = async (taskId) => {
  try {
    const task = await Task.findById(taskId)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');

    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Assign task to employee
exports.assignTask = async (taskId, employeeId) => {
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: { assignedTo: employeeId } },
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');

    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update task status
exports.updateTaskStatus = async (taskId, status) => {
  try {
    const updateData = { status };
    
    // If status is completed, set completedAt
    if (status === 'completed') {
      updateData.completedAt = Date.now();
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email position')
      .populate('createdBy', 'name');

    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
