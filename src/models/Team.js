import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  members: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Employee'
  }],
  leader: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Please assign a team leader']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
TeamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Team = mongoose.model('Team', TeamSchema);

export default Team;