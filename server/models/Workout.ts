import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  date: { type: Date, default: Date.now },
  split: { type: String, enum: ['Push', 'Pull', 'Legs', 'Custom'] },
  status: { type: String, enum: ['active', 'completed', 'template'], default: 'active' },
  exercises: [{
    name: String,
    muscleGroup: String,
    restTime: { type: Number, default: 90 },
    sets: [{
      reps: Number,
      weight: Number,
      completed: { type: Boolean, default: false }
    }]
  }],
  duration: Number,
  notes: String
});

workoutSchema.index({ userId: 1, status: 1 });
workoutSchema.index({ userId: 1, date: -1 });

export const Workout = mongoose.model('Workout', workoutSchema);
