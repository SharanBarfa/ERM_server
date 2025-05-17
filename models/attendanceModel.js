import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave', 'holiday'],
    default: 'present'
  },
  workHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  location: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate work hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn).getTime();
    const checkOutTime = new Date(this.checkOut).getTime();
    
    // Calculate hours
    this.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    // Round to 2 decimal places
    this.workHours = Math.round(this.workHours * 100) / 100;
  }
  
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
