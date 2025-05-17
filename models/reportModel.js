import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a report name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['attendance', 'performance', 'employee', 'department', 'payroll', 'custom'],
    required: true
  },
  description: {
    type: String
  },
  parameters: {
    startDate: Date,
    endDate: Date,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    employees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    status: String,
    customFilters: Object
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedData: {
    type: Object
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'pending'
  },
  fileUrl: {
    type: String
  },
  scheduledFor: {
    type: Date
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    dayOfWeek: Number,
    dayOfMonth: Number,
    month: Number
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
