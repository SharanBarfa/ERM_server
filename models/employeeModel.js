import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  position: {
    type: String,
    required: [true, 'Please add a position']
  },
  joinDate: {
    type: Date,
    required: [true, 'Please add a join date']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'leave', 'terminated'],
    default: 'active'
  },
  salary: {
    type: Number
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for attendance records
employeeSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'employee',
  justOne: false
});

// Virtual for performance records
employeeSchema.virtual('performance', {
  ref: 'Performance',
  localField: '_id',
  foreignField: 'employee',
  justOne: false
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
