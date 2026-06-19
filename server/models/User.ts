import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  measurements: [{
    date: { type: Date, default: Date.now },
    weight: Number,
    height: Number,
    waistline: Number,
    neck: Number,
    hips: Number,
    bodyFat: Number,
  }],
  goals: {
    type: String,
    enum: ['fat_loss', 'muscle_gain', 'maintenance'],
    default: 'maintenance'
  },
  weeklyWorkoutGoal: {
    type: Number,
    default: 4,
    min: 1,
    max: 7
  },
  isDemoUser: { type: Boolean, default: false },
  festivals: [{
    name: String,
    startDate: Date,
    endDate: Date,
  }],

  // AI Coach / WhatsApp
  whatsapp: { type: String, default: '' },
  coachingEnabled: { type: Boolean, default: false },
  coachPersonality: {
    type: String,
    enum: ['friendly', 'strict', 'funny', 'competitive', 'motivational'],
    default: 'motivational',
  },
  preferredMorningWorkoutTime: { type: String, default: '' },
  preferredEveningWorkoutTime: { type: String, default: '' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  dietRemindersEnabled: { type: Boolean, default: true },
  waterRemindersEnabled: { type: Boolean, default: true },
  dailyWaterTarget: { type: Number, default: 4 },

  // Per-day notification state (resets at midnight in user's timezone)
  notificationTracking: {
    date: { type: String, default: '' },
    totalSent: { type: Number, default: 0 },
    workoutRemindersSent: { type: Number, default: 0 },
    dietRemindersSent: { type: Number, default: 0 },
    waterRemindersSent: { type: Number, default: 0 },
    morningReminderSent: { type: Boolean, default: false },
    eveningReminderSent: { type: Boolean, default: false },
    waterGoalMessageSent: { type: Boolean, default: false },
    lastWaterReminderSentAt: { type: Date },
    lastDietReminderSentAt: { type: Date },
    // Persisted across daily resets:
    weeklyGoalSentWeek: { type: String, default: '' },
    lastStreakMilestoneSent: { type: Number, default: 0 },
    lastCoachStyle: { type: String, default: '' },
  },

  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
