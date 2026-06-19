import express from 'express';
import { Workout } from '../models/Workout.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get active workout
router.get('/active', auth, async (req: AuthRequest, res) => {
  try {
    const workout = await Workout.findOne({ userId: req.user?.id, status: 'active' });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get templates
router.get('/templates', auth, async (req: AuthRequest, res) => {
  try {
    let templates = await Workout.find({ userId: req.user?.id, status: 'template' }).sort({ date: -1 });

    if (templates.length === 0) {
      const defaultTemplates = [
        {
          userId: req.user?.id, name: 'Push Day', split: 'Push', status: 'template',
          exercises: [
            { name: 'Flat Bench Press',       muscleGroup: 'Chest',     restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Incline Dumbbell Press', muscleGroup: 'Chest',     restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Cable Crossovers',       muscleGroup: 'Chest',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Overhead Press',         muscleGroup: 'Shoulders', restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Lateral Raises',         muscleGroup: 'Shoulders', restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Tricep Pushdowns',       muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Overhead Extensions',    muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
          ]
        },
        {
          userId: req.user?.id, name: 'Pull Day', split: 'Pull', status: 'template',
          exercises: [
            { name: 'Deadlift',      muscleGroup: 'Back',       restTime: 180, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Barbell Rows',  muscleGroup: 'Back',       restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Lat Pulldowns', muscleGroup: 'Back',       restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Face Pulls',    muscleGroup: 'Rear Delts', restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Barbell Curls', muscleGroup: 'Biceps',     restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Hammer Curls',  muscleGroup: 'Biceps',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
          ]
        },
        {
          userId: req.user?.id, name: 'Leg Day', split: 'Legs', status: 'template',
          exercises: [
            { name: 'Barbell Squats',       muscleGroup: 'Quads',      restTime: 180, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Leg Press',            muscleGroup: 'Quads',      restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Leg Extensions',       muscleGroup: 'Quads',      restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Romanian Deadlifts',   muscleGroup: 'Hamstrings', restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Lying Leg Curls',      muscleGroup: 'Hamstrings', restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Barbell Hip Thrusts',  muscleGroup: 'Glutes',     restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
            { name: 'Standing Calf Raises', muscleGroup: 'Calves',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
          ]
        }
      ];
      await Workout.insertMany(defaultTemplates);
      templates = await Workout.find({ userId: req.user?.id, status: 'template' }).sort({ date: -1 });
    }

    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset templates
router.post('/templates/seed', auth, async (req: AuthRequest, res) => {
  try {
    await Workout.deleteMany({ userId: req.user?.id, status: 'template' });
    const defaultTemplates = [
      {
        userId: req.user?.id, name: 'Push Day', split: 'Push', status: 'template',
        exercises: [
          { name: 'Flat Bench Press',       muscleGroup: 'Chest',     restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Incline Dumbbell Press', muscleGroup: 'Chest',     restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Cable Crossovers',       muscleGroup: 'Chest',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Overhead Press',         muscleGroup: 'Shoulders', restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Lateral Raises',         muscleGroup: 'Shoulders', restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Tricep Pushdowns',       muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Overhead Extensions',    muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
        ]
      },
      {
        userId: req.user?.id, name: 'Pull Day', split: 'Pull', status: 'template',
        exercises: [
          { name: 'Deadlift',      muscleGroup: 'Back',       restTime: 180, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Barbell Rows',  muscleGroup: 'Back',       restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Lat Pulldowns', muscleGroup: 'Back',       restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Face Pulls',    muscleGroup: 'Rear Delts', restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Barbell Curls', muscleGroup: 'Biceps',     restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Hammer Curls',  muscleGroup: 'Biceps',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
        ]
      },
      {
        userId: req.user?.id, name: 'Leg Day', split: 'Legs', status: 'template',
        exercises: [
          { name: 'Barbell Squats',       muscleGroup: 'Quads',      restTime: 180, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Leg Press',            muscleGroup: 'Quads',      restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Leg Extensions',       muscleGroup: 'Quads',      restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Romanian Deadlifts',   muscleGroup: 'Hamstrings', restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Lying Leg Curls',      muscleGroup: 'Hamstrings', restTime: 90,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Barbell Hip Thrusts',  muscleGroup: 'Glutes',     restTime: 120, sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] },
          { name: 'Standing Calf Raises', muscleGroup: 'Calves',     restTime: 60,  sets: [{ reps: 0, weight: 0 }, { reps: 0, weight: 0 }, { reps: 0, weight: 0 }] }
        ]
      }
    ];
    await Workout.insertMany(defaultTemplates);
    const templates = await Workout.find({ userId: req.user?.id, status: 'template' }).sort({ date: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a template
router.post('/templates', auth, async (req: AuthRequest, res) => {
  try {
    const template = new Workout({ ...req.body, userId: req.user?.id, status: 'template' });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new workout (with weight pre-fill from last session)
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const active = await Workout.findOne({ userId: req.user?.id, status: 'active' });
    if (active) return res.status(400).json({ error: 'You already have an active workout' });

    let workoutData: any = { ...req.body, userId: req.user?.id, status: 'active' };

    if (req.body.templateId) {
      const template = await Workout.findOne({ _id: req.body.templateId, userId: req.user?.id });
      if (template) {
        // Build map: exerciseName → last sets from most recent completed workout
        const exerciseNames = (template.exercises || []).map((ex: any) => ex.name).filter(Boolean);
        const recentWorkouts = await Workout.find({
          userId: req.user?.id,
          status: 'completed',
          'exercises.name': { $in: exerciseNames }
        }).sort({ date: -1 }).limit(30);

        const lastSetsMap: Record<string, any[]> = {};
        for (const name of exerciseNames) {
          for (const w of recentWorkouts) {
            const ex = (w.exercises || []).find((e: any) => e.name === name);
            if (ex && ex.sets && ex.sets.length > 0) {
              lastSetsMap[name] = ex.sets;
              break;
            }
          }
        }

        workoutData.name = template.name;
        workoutData.split = template.split;
        workoutData.exercises = (template.exercises || []).map((ex: any) => {
          const lastSets = lastSetsMap[ex.name];
          return {
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            restTime: ex.restTime,
            sets: (ex.sets || []).map((set: any, i: number) => ({
              reps: lastSets?.[i]?.reps || set.reps || 0,
              weight: lastSets?.[i]?.weight || set.weight || 0,
              completed: false
            }))
          };
        });
      }
    }

    const workout = new Workout(workoutData);
    await workout.save();
    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update workout
router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      req.body,
      { new: true }
    );
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a completed workout
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.id,
      status: 'completed'
    });
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all completed workouts (with pagination)
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const workouts = await Workout.find({ userId: req.user?.id, status: 'completed' })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get exercise history
router.get('/history/:exerciseName', auth, async (req: AuthRequest, res) => {
  try {
    const workouts = await Workout.find({
      userId: req.user?.id,
      status: 'completed',
      'exercises.name': req.params.exerciseName
    }).sort({ date: 1 }).limit(20);
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
