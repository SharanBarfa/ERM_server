import mongoose from 'mongoose';
import Attendance from '../models/attendanceModel.js';
import Employee from '../models/employeeModel.js';

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendanceRecords = async (req, res) => {
  try {
    // Build query
    let query = {};

    // Filter by date
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = {
        $gte: date,
        $lt: nextDay
      };
    }

    // Filter by employee
    if (req.query.employee) {
      query.employee = req.query.employee;
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .sort({ date: -1, checkIn: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      count: attendanceRecords.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('createdBy', 'name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private
export const createAttendance = async (req, res) => {
  try {
    const { employee, date, checkIn, checkOut, status, notes, location } = req.body;

    // Check if employee exists
    const employeeExists = await Employee.findById(employee);

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Check if attendance record already exists for this employee and date
    if (date) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

      const existingRecord = await Attendance.findOne({
        employee,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          error: 'Attendance record already exists for this employee and date'
        });
      }
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employee,
      date: date || new Date(),
      checkIn,
      checkOut,
      status,
      notes,
      location,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
export const updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    // Update attendance record
    attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();

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

// @desc    Check in employee
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = async (req, res) => {
  try {
    const { employeeId, location } = req.body;

    // Get employee by ID - handle both employeeId and _id
    let employee;

    // Check if employeeId is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      employee = await Employee.findById(employeeId);
    }

    // If not found by _id, try to find by employeeId
    if (!employee) {
      employee = await Employee.findOne({ employeeId });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Check if already checked in today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const existingRecord = await Attendance.findOne({
      employee: employee._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingRecord) {
      // If already checked in but not checked out, return error
      if (existingRecord.checkIn && !existingRecord.checkOut) {
        return res.status(400).json({
          success: false,
          error: 'Employee already checked in today'
        });
      }

      // If record exists but no check-in (e.g., marked as absent), update it
      const checkInTime = new Date();
      const isLate = checkInTime.getHours() >= 10;
      
      existingRecord.checkIn = checkInTime;
      existingRecord.status = isLate ? 'late' : 'present';
      existingRecord.location = location;

      await existingRecord.save();

      return res.json({
        success: true,
        data: existingRecord
      });
    }

    // Create new attendance record
    const checkInTime = new Date();
    const isLate = checkInTime.getHours() >= 10;

    const attendance = await Attendance.create({
      employee: employee._id,
      date: new Date(),
      checkIn: checkInTime,
      status: isLate ? 'late' : 'present',
      location,
      createdBy: req.user._id
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Check out employee
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = async (req, res) => {
  try {
    const { employeeId, location } = req.body;

    // Get employee by ID - handle both employeeId and _id
    let employee;

    // Check if employeeId is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      employee = await Employee.findById(employeeId);
    }

    // If not found by _id, try to find by employeeId
    if (!employee) {
      employee = await Employee.findOne({ employeeId });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Find today's attendance record
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendanceRecord = await Attendance.findOne({
      employee: employee._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'No check-in record found for today'
      });
    }

    // If already checked out, return error
    if (attendanceRecord.checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Employee already checked out today'
      });
    }

    // Update check-out time
    attendanceRecord.checkOut = new Date();
    attendanceRecord.location = location || attendanceRecord.location;

    await attendanceRecord.save();

    res.json({
      success: true,
      data: attendanceRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get attendance stats
// @route   GET /api/attendance/stats
// @access  Private
export const getAttendanceStats = async (req, res) => {
  try {
    // Get date range
    const { startDate, endDate } = req.query;
    let dateQuery = {};

    if (startDate && endDate) {
      dateQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      dateQuery = {
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }

    // Get attendance counts by status
    const statusCounts = await Attendance.aggregate([
      { $match: dateQuery },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format status counts
    const formattedStatusCounts = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      holiday: 0
    };

    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    // Get department attendance
    const departmentAttendance = await Attendance.aggregate([
      { $match: { ...dateQuery, status: 'present' } },
      { $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: '$employeeInfo' },
      { $lookup: {
          from: 'departments',
          localField: 'employeeInfo.department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      { $unwind: '$departmentInfo' },
      { $group: {
          _id: '$departmentInfo._id',
          name: { $first: '$departmentInfo.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get average work hours
    const workHoursData = await Attendance.aggregate([
      { $match: { ...dateQuery, workHours: { $gt: 0 } } },
      { $group: {
          _id: null,
          averageHours: { $avg: '$workHours' },
          totalHours: { $sum: '$workHours' }
        }
      }
    ]);

    const averageWorkHours = workHoursData.length > 0 ?
      Math.round(workHoursData[0].averageHours * 100) / 100 : 0;

    const totalWorkHours = workHoursData.length > 0 ?
      Math.round(workHoursData[0].totalHours * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        statusCounts: formattedStatusCounts,
        departmentAttendance,
        averageWorkHours,
        totalWorkHours
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
