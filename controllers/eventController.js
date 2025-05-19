import Event from '../models/eventModel.js';
import Activity from '../models/activityModel.js';

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, endDate, location, participants, type } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      endDate,
      location,
      participants,
      type,
      createdBy: req.user._id
    });

    // Create activity log for new event
    await Activity.create({
      type: 'new_event',
      user: req.user._id,
      subject: 'New Event Created',
      description: `New event "${title}" has been created`,
      relatedTo: {
        model: 'Event',
        id: event._id
      },
      metadata: {
        eventTitle: title,
        eventDate: date
      }
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
export const getEvents = async (req, res) => {
  try {
    // Filter options
    const filter = {};
    
    // Date filter
    if (req.query.startDate) {
      filter.date = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      if (filter.date) {
        filter.date.$lte = new Date(req.query.endDate);
      } else {
        filter.date = { $lte: new Date(req.query.endDate) };
      }
    }
    
    // Type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Get events
    const events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Private
export const getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const events = await Event.find({
      date: { $gte: new Date() }
    })
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await event.remove();

    res.status(200).json({
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