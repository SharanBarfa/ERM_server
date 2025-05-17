const Team = require('../models/Team');
const Employee = require('../models/Employee');

// Get all teams with populated members and leader
exports.getTeams = async () => {
  try {
    const teams = await Team.find()
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');
    return { success: true, data: teams };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create a new team
exports.createTeam = async (teamData) => {
  try {
    const team = await Team.create(teamData);
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');
    return { success: true, data: populatedTeam };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update a team
exports.updateTeam = async (teamId, updateData) => {
  try {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');

    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    return { success: true, data: team };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a team
exports.deleteTeam = async (teamId) => {
  try {
    const team = await Team.findByIdAndDelete(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    return { success: true, data: team };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add members to a team
exports.addTeamMembers = async (teamId, memberIds) => {
  try {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: { $each: memberIds } } },
      { new: true, runValidators: true }
    )
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');

    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    return { success: true, data: team };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Remove members from a team
exports.removeTeamMembers = async (teamId, memberIds) => {
  try {
    const team = await Team.findByIdAndUpdate(
      teamId,
      { $pullAll: { members: memberIds } },
      { new: true, runValidators: true }
    )
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');

    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    return { success: true, data: team };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get team by ID
exports.getTeamById = async (teamId) => {
  try {
    const team = await Team.findById(teamId)
      .populate('members', 'firstName lastName email position')
      .populate('leader', 'firstName lastName email position')
      .populate('project', 'name description');

    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    return { success: true, data: team };
  } catch (error) {
    return { success: false, error: error.message };
  }
}; 