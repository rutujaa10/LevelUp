import mongoose from 'mongoose';

const dietSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  meals: [{
    name: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    time: String
  }],
  waterIntake: { type: Number, default: 0 },
  notes: String
});

dietSchema.index({ userId: 1, date: -1 });

export const Diet = mongoose.model('Diet', dietSchema);
