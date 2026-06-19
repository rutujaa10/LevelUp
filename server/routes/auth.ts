import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { sendWhatsApp } from '../services/twilioService.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, age, gender,
      whatsapp, coachingEnabled, coachPersonality,
      preferredMorningWorkoutTime, preferredEveningWorkoutTime, timezone,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = { name, email, password: hashedPassword };

    if (age) userData.age = Number(age);
    if (gender) userData.gender = gender;
    if (whatsapp) userData.whatsapp = whatsapp;
    if (coachingEnabled) userData.coachingEnabled = true;
    if (coachPersonality) userData.coachPersonality = coachPersonality;
    if (preferredMorningWorkoutTime) userData.preferredMorningWorkoutTime = preferredMorningWorkoutTime;
    if (preferredEveningWorkoutTime) userData.preferredEveningWorkoutTime = preferredEveningWorkoutTime;
    if (timezone) userData.timezone = timezone;

    const user = new User(userData);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email, age: user.age, gender: user.gender } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email, isDemoUser: user.isDemoUser } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/measurements', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.measurements.push(req.body);
    await user.save();
    res.json(user.measurements);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', auth, async (req: AuthRequest, res) => {
  try {
    const {
      weeklyWorkoutGoal, age, gender,
      whatsapp, coachingEnabled, coachPersonality,
      preferredMorningWorkoutTime, preferredEveningWorkoutTime, timezone,
      dietRemindersEnabled, waterRemindersEnabled, dailyWaterTarget,
    } = req.body;

    const updates: Record<string, any> = {};
    if (weeklyWorkoutGoal !== undefined) updates.weeklyWorkoutGoal = weeklyWorkoutGoal;
    if (age !== undefined) updates.age = Number(age);
    if (gender !== undefined) updates.gender = gender;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;
    if (coachingEnabled !== undefined) updates.coachingEnabled = coachingEnabled;
    if (coachPersonality !== undefined) updates.coachPersonality = coachPersonality;
    if (preferredMorningWorkoutTime !== undefined) updates.preferredMorningWorkoutTime = preferredMorningWorkoutTime;
    if (preferredEveningWorkoutTime !== undefined) updates.preferredEveningWorkoutTime = preferredEveningWorkoutTime;
    if (timezone !== undefined) updates.timezone = timezone;
    if (dietRemindersEnabled !== undefined) updates.dietRemindersEnabled = dietRemindersEnabled;
    if (waterRemindersEnabled !== undefined) updates.waterRemindersEnabled = waterRemindersEnabled;
    if (dailyWaterTarget !== undefined) updates.dailyWaterTarget = Number(dailyWaterTarget);

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a test WhatsApp message — uses number from request body so saving first is not required
router.post('/coach/test', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const to: string = req.body.whatsapp || (user as any).whatsapp || '';
    if (!to) return res.status(400).json({ error: 'Enter your WhatsApp number first.' });

    const firstName = user.name.split(' ')[0];
    const msg = `Hi ${firstName}! Your LevelUp AI Coach is now active. I'll send personalized workout reminders, nutrition insights, and motivation based on your real streaks, macros, and progress. Let's build something great.`;
    await sendWhatsApp(to, msg);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Coach test error:', err);
    res.status(500).json({ error: err.message || 'Failed to send test message' });
  }
});

export default router;
