const teamService = require('../services/teamService');

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const result = await teamService.getTeams();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const result = await teamService.createTeam(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const result = await teamService.updateTeam(req.params.id, req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const result = await teamService.deleteTeam(req.params.id);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add members to a team
exports.addTeamMembers = async (req, res) => {
  try {
    const result = await teamService.addTeamMembers(req.params.id, req.body.memberIds);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove members from a team
exports.removeTeamMembers = async (req, res) => {
  try {
    const result = await teamService.removeTeamMembers(req.params.id, req.body.memberIds);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const result = await teamService.getTeamById(req.params.id);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 