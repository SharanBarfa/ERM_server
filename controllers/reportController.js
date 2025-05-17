import Report from '../models/reportModel.js';
import Employee from '../models/employeeModel.js';
import Department from '../models/departmentModel.js';
import Attendance from '../models/attendanceModel.js';

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
export const getReports = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    // Filter by type
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Filter by created by
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }
    
    // Search by name
    if (req.query.search) {
      query.name = new RegExp(req.query.search, 'i');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const reports = await Report.find(query)
      .populate('createdBy', 'name')
      .populate('parameters.department', 'name')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Report.countDocuments(query);
    
    res.json({
      success: true,
      count: reports.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('parameters.department', 'name')
      .populate('parameters.employees', 'firstName lastName employeeId');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      parameters,
      format,
      scheduledFor,
      isRecurring,
      recurringPattern
    } = req.body;
    
    // Create report
    const report = await Report.create({
      name,
      type,
      description,
      parameters,
      format: format || 'pdf',
      scheduledFor,
      isRecurring: isRecurring || false,
      recurringPattern,
      createdBy: req.user._id,
      status: scheduledFor ? 'pending' : 'generated'
    });
    
    // If not scheduled, generate report data immediately
    if (!scheduledFor) {
      const generatedData = await generateReportData(report);
      
      report.generatedData = generatedData;
      report.status = 'generated';
      
      await report.save();
    }
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
export const updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Check if user is the creator or admin
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this report'
      });
    }
    
    // Update report
    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Check if user is the creator or admin
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this report'
      });
    }
    
    await report.deleteOne();
    
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

// @desc    Generate report
// @route   POST /api/reports/:id/generate
// @access  Private
export const generateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Generate report data
    const generatedData = await generateReportData(report);
    
    // Update report
    report.generatedData = generatedData;
    report.status = 'generated';
    
    await report.save();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to generate report data
const generateReportData = async (report) => {
  const { type, parameters } = report;
  let data = {};
  
  switch (type) {
    case 'attendance':
      data = await generateAttendanceReport(parameters);
      break;
    case 'performance':
      data = await generatePerformanceReport(parameters);
      break;
    case 'employee':
      data = await generateEmployeeReport(parameters);
      break;
    case 'department':
      data = await generateDepartmentReport(parameters);
      break;
    case 'payroll':
      data = await generatePayrollReport(parameters);
      break;
    default:
      data = { message: 'Report type not supported' };
  }
  
  return data;
};

// Helper function to generate attendance report
const generateAttendanceReport = async (parameters) => {
  const { startDate, endDate, department, employees, status } = parameters;
  
  let query = {};
  
  // Date range
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Department filter
  if (department) {
    const departmentEmployees = await Employee.find({ department }).select('_id');
    const employeeIds = departmentEmployees.map(emp => emp._id);
    
    query.employee = { $in: employeeIds };
  }
  
  // Employee filter
  if (employees && employees.length > 0) {
    query.employee = { $in: employees };
  }
  
  // Status filter
  if (status) {
    query.status = status;
  }
  
  // Get attendance records
  const attendanceRecords = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId department',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .sort({ date: 1 });
  
  // Calculate summary
  const summary = {
    totalRecords: attendanceRecords.length,
    presentCount: attendanceRecords.filter(record => record.status === 'present').length,
    absentCount: attendanceRecords.filter(record => record.status === 'absent').length,
    lateCount: attendanceRecords.filter(record => record.status === 'late').length,
    leaveCount: attendanceRecords.filter(record => record.status === 'leave').length,
    totalWorkHours: attendanceRecords.reduce((sum, record) => sum + (record.workHours || 0), 0)
  };
  
  // Group by employee
  const employeeAttendance = {};
  
  attendanceRecords.forEach(record => {
    const employeeId = record.employee._id.toString();
    
    if (!employeeAttendance[employeeId]) {
      employeeAttendance[employeeId] = {
        employeeId: record.employee.employeeId,
        name: `${record.employee.firstName} ${record.employee.lastName}`,
        department: record.employee.department ? record.employee.department.name : 'N/A',
        records: [],
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          totalHours: 0
        }
      };
    }
    
    employeeAttendance[employeeId].records.push({
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workHours: record.workHours
    });
    
    // Update summary
    employeeAttendance[employeeId].summary[record.status]++;
    employeeAttendance[employeeId].summary.totalHours += record.workHours || 0;
  });
  
  return {
    summary,
    employeeAttendance: Object.values(employeeAttendance),
    records: attendanceRecords
  };
};

// Helper function to generate performance report
const generatePerformanceReport = async (parameters) => {
  const { startDate, endDate, department, employees } = parameters;
  
  let query = {};
  
  // Date range
  if (startDate && endDate) {
    query.reviewDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Department filter
  if (department) {
    const departmentEmployees = await Employee.find({ department }).select('_id');
    const employeeIds = departmentEmployees.map(emp => emp._id);
    
    query.employee = { $in: employeeIds };
  }
  
  // Employee filter
  if (employees && employees.length > 0) {
    query.employee = { $in: employees };
  }
  
  // Get performance reviews
  const performanceReviews = await Performance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId department position',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .populate('reviewer', 'name')
    .sort({ reviewDate: 1 });
  
  // Calculate summary
  const summary = {
    totalReviews: performanceReviews.length,
    averageRating: performanceReviews.length > 0 ? 
      performanceReviews.reduce((sum, review) => sum + review.overallRating, 0) / performanceReviews.length : 0,
    ratingDistribution: {
      excellent: performanceReviews.filter(review => review.overallRating >= 4.5).length,
      good: performanceReviews.filter(review => review.overallRating >= 3.5 && review.overallRating < 4.5).length,
      average: performanceReviews.filter(review => review.overallRating >= 2.5 && review.overallRating < 3.5).length,
      needsImprovement: performanceReviews.filter(review => review.overallRating < 2.5).length
    }
  };
  
  // Calculate average ratings by category
  const ratingCategories = {
    productivity: 0,
    quality: 0,
    jobKnowledge: 0,
    communication: 0,
    teamwork: 0,
    initiative: 0
  };
  
  if (performanceReviews.length > 0) {
    performanceReviews.forEach(review => {
      ratingCategories.productivity += review.ratings.productivity;
      ratingCategories.quality += review.ratings.quality;
      ratingCategories.jobKnowledge += review.ratings.jobKnowledge;
      ratingCategories.communication += review.ratings.communication;
      ratingCategories.teamwork += review.ratings.teamwork;
      ratingCategories.initiative += review.ratings.initiative;
    });
    
    for (const category in ratingCategories) {
      ratingCategories[category] = ratingCategories[category] / performanceReviews.length;
    }
  }
  
  summary.ratingCategories = ratingCategories;
  
  // Group by department
  const departmentPerformance = {};
  
  performanceReviews.forEach(review => {
    if (!review.employee || !review.employee.department) return;
    
    const departmentId = review.employee.department._id.toString();
    const departmentName = review.employee.department.name;
    
    if (!departmentPerformance[departmentId]) {
      departmentPerformance[departmentId] = {
        name: departmentName,
        reviews: [],
        averageRating: 0,
        employeeCount: 0
      };
    }
    
    departmentPerformance[departmentId].reviews.push({
      employeeId: review.employee.employeeId,
      name: `${review.employee.firstName} ${review.employee.lastName}`,
      position: review.employee.position,
      overallRating: review.overallRating,
      reviewDate: review.reviewDate
    });
  });
  
  // Calculate department averages
  for (const deptId in departmentPerformance) {
    const dept = departmentPerformance[deptId];
    dept.employeeCount = dept.reviews.length;
    dept.averageRating = dept.reviews.reduce((sum, review) => sum + review.overallRating, 0) / dept.employeeCount;
  }
  
  return {
    summary,
    departmentPerformance: Object.values(departmentPerformance),
    reviews: performanceReviews.map(review => ({
      id: review._id,
      employee: {
        id: review.employee._id,
        employeeId: review.employee.employeeId,
        name: `${review.employee.firstName} ${review.employee.lastName}`,
        position: review.employee.position,
        department: review.employee.department ? review.employee.department.name : 'N/A'
      },
      reviewer: review.reviewer ? review.reviewer.name : 'N/A',
      reviewDate: review.reviewDate,
      reviewPeriod: review.reviewPeriod,
      overallRating: review.overallRating,
      status: review.status
    }))
  };
};

// Helper function to generate employee report
const generateEmployeeReport = async (parameters) => {
  const { department, status } = parameters;
  
  let query = {};
  
  // Department filter
  if (department) {
    query.department = department;
  }
  
  // Status filter
  if (status) {
    query.status = status;
  }
  
  // Get employees
  const employees = await Employee.find(query)
    .populate('department', 'name')
    .populate('user', 'email')
    .sort({ firstName: 1, lastName: 1 });
  
  // Calculate summary
  const summary = {
    totalEmployees: employees.length,
    statusDistribution: {
      active: employees.filter(emp => emp.status === 'active').length,
      inactive: employees.filter(emp => emp.status === 'inactive').length,
      leave: employees.filter(emp => emp.status === 'leave').length,
      terminated: employees.filter(emp => emp.status === 'terminated').length
    }
  };
  
  // Group by department
  const departmentEmployees = {};
  
  employees.forEach(employee => {
    if (!employee.department) return;
    
    const departmentId = employee.department._id.toString();
    const departmentName = employee.department.name;
    
    if (!departmentEmployees[departmentId]) {
      departmentEmployees[departmentId] = {
        name: departmentName,
        employees: [],
        count: 0
      };
    }
    
    departmentEmployees[departmentId].employees.push({
      id: employee._id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      position: employee.position,
      status: employee.status,
      joinDate: employee.joinDate
    });
    
    departmentEmployees[departmentId].count++;
  });
  
  return {
    summary,
    departmentEmployees: Object.values(departmentEmployees),
    employees: employees.map(emp => ({
      id: emp._id,
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department ? emp.department.name : 'N/A',
      position: emp.position,
      status: emp.status,
      joinDate: emp.joinDate
    }))
  };
};

// Helper function to generate department report
const generateDepartmentReport = async (parameters) => {
  // Get all departments
  const departments = await Department.find()
    .populate('manager', 'firstName lastName')
    .sort({ name: 1 });
  
  // Get employee counts for each department
  const departmentsWithData = await Promise.all(
    departments.map(async (dept) => {
      const employees = await Employee.find({ department: dept._id });
      
      return {
        id: dept._id,
        name: dept.name,
        description: dept.description,
        manager: dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'N/A',
        budget: dept.budget,
        location: dept.location,
        employeeCount: employees.length,
        employees: employees.map(emp => ({
          id: emp._id,
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          status: emp.status
        }))
      };
    })
  );
  
  // Calculate summary
  const summary = {
    totalDepartments: departments.length,
    totalEmployees: departmentsWithData.reduce((sum, dept) => sum + dept.employeeCount, 0),
    totalBudget: departments.reduce((sum, dept) => sum + (dept.budget || 0), 0),
    averageEmployeesPerDepartment: departmentsWithData.length > 0 ? 
      departmentsWithData.reduce((sum, dept) => sum + dept.employeeCount, 0) / departmentsWithData.length : 0
  };
  
  return {
    summary,
    departments: departmentsWithData
  };
};

// Helper function to generate payroll report
const generatePayrollReport = async (parameters) => {
  const { startDate, endDate, department, employees } = parameters;
  
  let query = {};
  
  // Department filter
  if (department) {
    query.department = department;
  }
  
  // Employee filter
  if (employees && employees.length > 0) {
    query._id = { $in: employees };
  }
  
  // Get employees
  const employeeList = await Employee.find(query)
    .populate('department', 'name')
    .sort({ firstName: 1, lastName: 1 });
  
  // Get attendance for date range
  let attendanceQuery = {};
  
  if (startDate && endDate) {
    attendanceQuery.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (employees && employees.length > 0) {
    attendanceQuery.employee = { $in: employees };
  } else if (department) {
    attendanceQuery.employee = { $in: employeeList.map(emp => emp._id) };
  }
  
  const attendanceRecords = await Attendance.find(attendanceQuery);
  
  // Calculate payroll data
  const payrollData = employeeList.map(employee => {
    // Get attendance for this employee
    const employeeAttendance = attendanceRecords.filter(
      record => record.employee.toString() === employee._id.toString()
    );
    
    // Calculate work days and hours
    const workDays = employeeAttendance.filter(
      record => record.status === 'present' || record.status === 'late'
    ).length;
    
    const totalHours = employeeAttendance.reduce(
      (sum, record) => sum + (record.workHours || 0), 0
    );
    
    // Calculate basic salary (assuming monthly salary)
    const monthlySalary = employee.salary || 0;
    const dailyRate = monthlySalary / 22; // Assuming 22 working days per month
    const hourlyRate = monthlySalary / (22 * 8); // Assuming 8 hours per day
    
    // Calculate gross pay
    const basicPay = workDays * dailyRate;
    
    return {
      id: employee._id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department ? employee.department.name : 'N/A',
      position: employee.position,
      salary: monthlySalary,
      workDays,
      totalHours,
      basicPay,
      hourlyRate,
      dailyRate
    };
  });
  
  // Calculate summary
  const summary = {
    totalEmployees: payrollData.length,
    totalSalary: payrollData.reduce((sum, emp) => sum + (emp.salary || 0), 0),
    totalWorkDays: payrollData.reduce((sum, emp) => sum + emp.workDays, 0),
    totalWorkHours: payrollData.reduce((sum, emp) => sum + emp.totalHours, 0),
    totalBasicPay: payrollData.reduce((sum, emp) => sum + emp.basicPay, 0)
  };
  
  return {
    summary,
    payrollData,
    period: {
      startDate,
      endDate
    }
  };
};
