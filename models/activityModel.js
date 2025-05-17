import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'new_employee',
      'employee_update',
      'attendance',
      'leave_request',
      'department_update',
      'project_update',
      'resource_allocation',
      'performance_review',
      'training_completed',
      'system_update'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Employee', 'Department', 'Project', 'Team', 'Attendance', 'Leave']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Index for faster queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity; 