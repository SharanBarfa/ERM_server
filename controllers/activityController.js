import Activity from '../models/activityModel.js';
import User from '../models/userModel.js';

// @desc    Get recent activities
// @route   GET /api/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;

    // Build query
    const query = {};
    if (type) {
      query.type = type;
    }

    // Get activities with populated user data
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private
export const createActivity = async (req, res) => {
  try {
    const { type, subject, description, relatedTo, metadata } = req.body;

    // Create activity
    const activity = await Activity.create({
      type,
      user: req.user.id,
      subject,
      description,
      relatedTo,
      metadata
    });

    // Populate user data
    await activity.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user activities
// @route   GET /api/activities/user/:userId
// @access  Private
export const getUserActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;

    // Build query
    const query = { user: req.params.userId };
    if (type) {
      query.type = type;
    }

    // Get activities
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 