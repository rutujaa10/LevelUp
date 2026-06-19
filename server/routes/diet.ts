import express from 'express';
import { Diet } from '../models/Diet.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let diet = await Diet.findOne({
      userId: req.user?.id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (diet) {
      if (!diet.meals) diet.set('meals', []);
      diet.meals.push(req.body.meals[0]);
      diet.markModified('meals');
      await diet.save();
    } else {
      diet = new Diet({ ...req.body, userId: req.user?.id });
      await diet.save();
    }

    res.status(201).json(diet);
  } catch (err) {
    console.error('Error in POST /api/diet:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 90);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const diets = await Diet.find({ userId: req.user?.id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(diets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update today's water intake — creates a diet entry if none exists for today
router.patch('/water', auth, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let diet = await Diet.findOne({ userId: req.user?.id, date: { $gte: today, $lt: tomorrow } });
    if (diet) {
      diet.waterIntake = Math.max(0, Number(req.body.waterIntake));
      await diet.save();
    } else {
      diet = new Diet({ userId: req.user?.id, meals: [], waterIntake: Math.max(0, Number(req.body.waterIntake)) });
      await diet.save();
    }
    res.json(diet);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const diet = await Diet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { $set: req.body },
      { new: true }
    );
    if (!diet) return res.status(404).json({ error: 'Diet not found' });
    res.json(diet);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const diet = await Diet.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!diet) return res.status(404).json({ error: 'Diet entry not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/meals/:mealId', auth, async (req: AuthRequest, res) => {
  try {
    const diet = await Diet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { $pull: { meals: { _id: req.params.mealId } } },
      { new: true }
    );
    if (!diet) return res.status(404).json({ error: 'Diet not found' });
    res.json(diet);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
