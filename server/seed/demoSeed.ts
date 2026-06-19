/**
 * Demo User Seeder — Alex Johnson
 *
 * Realistic 10-week cut: ~36 total workouts, 5-day active streak,
 * non-linear weight (plateau week 4, bounce weeks 8-9), imperfect diet.
 *
 * Email:    demo@levelup.com
 * Password: demo123
 */

import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Workout } from '../models/Workout.js';
import { Diet } from '../models/Diet.js';

export const DEMO_EMAIL = 'demo@levelup.com';
export const DEMO_PASSWORD = 'demo123';
export const DEMO_NAME = 'Alex Johnson';

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function r(n: number): number { return Math.round(n * 2) / 2; }

function pushDayExercises(week: number) {
  const bench   = r(62 + week * 1.5);
  const incline = r(22 + week * 1.0);
  const cable   = r(10 + week * 0.75);
  const ohp     = r(42 + week * 1.5);
  const lateral = r(8  + week * 0.5);
  const tricep  = r(15 + week * 0.75);
  return [
    { name: 'Flat Bench Press',       muscleGroup: 'Chest',     restTime: 120,
      sets: [{ reps: 8, weight: bench,       completed: true },
             { reps: 8, weight: bench,       completed: true },
             { reps: 7, weight: bench + 2.5, completed: true },
             { reps: 6, weight: bench + 2.5, completed: true }] },
    { name: 'Incline Dumbbell Press', muscleGroup: 'Chest',     restTime: 90,
      sets: [{ reps: 10, weight: incline, completed: true },
             { reps: 10, weight: incline, completed: true },
             { reps: 9,  weight: incline, completed: true }] },
    { name: 'Cable Crossovers',       muscleGroup: 'Chest',     restTime: 60,
      sets: [{ reps: 12, weight: cable, completed: true },
             { reps: 12, weight: cable, completed: true },
             { reps: 12, weight: cable, completed: true }] },
    { name: 'Overhead Press',         muscleGroup: 'Shoulders', restTime: 120,
      sets: [{ reps: 8, weight: ohp,       completed: true },
             { reps: 8, weight: ohp,       completed: true },
             { reps: 7, weight: ohp + 2.5, completed: true }] },
    { name: 'Lateral Raises',         muscleGroup: 'Shoulders', restTime: 60,
      sets: [{ reps: 15, weight: lateral, completed: true },
             { reps: 15, weight: lateral, completed: true },
             { reps: 12, weight: lateral, completed: true }] },
    { name: 'Tricep Pushdowns',       muscleGroup: 'Triceps',   restTime: 60,
      sets: [{ reps: 12, weight: tricep,       completed: true },
             { reps: 12, weight: tricep,       completed: true },
             { reps: 10, weight: tricep + 2.5, completed: true }] },
    { name: 'Overhead Extensions',    muscleGroup: 'Triceps',   restTime: 60,
      sets: [{ reps: 12, weight: tricep - 2.5, completed: true },
             { reps: 12, weight: tricep - 2.5, completed: true },
             { reps: 10, weight: tricep,        completed: true }] },
  ];
}

function pullDayExercises(week: number) {
  const dead    = r(80 + week * 3.0);
  const rows    = r(60 + week * 2.0);
  const pull    = r(50 + week * 2.0);
  const face    = r(15 + week * 0.75);
  const curl    = r(25 + week * 1.75);
  const hammer  = r(12 + week * 0.75);
  return [
    { name: 'Deadlift',      muscleGroup: 'Back',       restTime: 180,
      sets: [{ reps: 5, weight: dead,     completed: true },
             { reps: 5, weight: dead,     completed: true },
             { reps: 3, weight: dead + 5, completed: true }] },
    { name: 'Barbell Rows',  muscleGroup: 'Back',       restTime: 120,
      sets: [{ reps: 8, weight: rows, completed: true },
             { reps: 8, weight: rows, completed: true },
             { reps: 8, weight: rows, completed: true }] },
    { name: 'Lat Pulldowns', muscleGroup: 'Back',       restTime: 90,
      sets: [{ reps: 10, weight: pull,     completed: true },
             { reps: 10, weight: pull,     completed: true },
             { reps: 8,  weight: pull + 5, completed: true }] },
    { name: 'Face Pulls',    muscleGroup: 'Rear Delts', restTime: 60,
      sets: [{ reps: 15, weight: face, completed: true },
             { reps: 15, weight: face, completed: true },
             { reps: 15, weight: face, completed: true }] },
    { name: 'Barbell Curls', muscleGroup: 'Biceps',     restTime: 90,
      sets: [{ reps: 10, weight: curl,       completed: true },
             { reps: 10, weight: curl,       completed: true },
             { reps: 8,  weight: curl + 2.5, completed: true }] },
    { name: 'Hammer Curls',  muscleGroup: 'Biceps',     restTime: 60,
      sets: [{ reps: 12, weight: hammer,     completed: true },
             { reps: 12, weight: hammer,     completed: true },
             { reps: 10, weight: hammer + 2, completed: true }] },
  ];
}

function legDayExercises(week: number) {
  const squat   = r(65 + week * 3.0);
  const press   = r(80 + week * 4.5);
  const ext     = r(30 + week * 1.5);
  const rdl     = r(65 + week * 2.0);
  const curl    = r(25 + week * 1.0);
  const thrust  = r(65 + week * 3.0);
  const calf    = r(40 + week * 2.0);
  return [
    { name: 'Barbell Squats',       muscleGroup: 'Quads',      restTime: 180,
      sets: [{ reps: 8, weight: squat,      completed: true },
             { reps: 8, weight: squat,      completed: true },
             { reps: 6, weight: squat + 5,  completed: true },
             { reps: 6, weight: squat + 5,  completed: true }] },
    { name: 'Leg Press',            muscleGroup: 'Quads',      restTime: 120,
      sets: [{ reps: 10, weight: press,      completed: true },
             { reps: 10, weight: press,      completed: true },
             { reps: 8,  weight: press + 10, completed: true }] },
    { name: 'Leg Extensions',       muscleGroup: 'Quads',      restTime: 60,
      sets: [{ reps: 12, weight: ext, completed: true },
             { reps: 12, weight: ext, completed: true },
             { reps: 12, weight: ext, completed: true }] },
    { name: 'Romanian Deadlifts',   muscleGroup: 'Hamstrings', restTime: 120,
      sets: [{ reps: 10, weight: rdl,     completed: true },
             { reps: 10, weight: rdl,     completed: true },
             { reps: 8,  weight: rdl + 5, completed: true }] },
    { name: 'Lying Leg Curls',      muscleGroup: 'Hamstrings', restTime: 90,
      sets: [{ reps: 12, weight: curl,       completed: true },
             { reps: 12, weight: curl,       completed: true },
             { reps: 10, weight: curl + 2.5, completed: true }] },
    { name: 'Barbell Hip Thrusts',  muscleGroup: 'Glutes',     restTime: 120,
      sets: [{ reps: 10, weight: thrust,      completed: true },
             { reps: 10, weight: thrust,      completed: true },
             { reps: 8,  weight: thrust + 10, completed: true }] },
    { name: 'Standing Calf Raises', muscleGroup: 'Calves',     restTime: 60,
      sets: [{ reps: 15, weight: calf, completed: true },
             { reps: 15, weight: calf, completed: true },
             { reps: 15, weight: calf, completed: true }] },
  ];
}

function exForSplit(split: 'Push' | 'Pull' | 'Legs', week: number) {
  if (split === 'Push') return pushDayExercises(week);
  if (split === 'Pull') return pullDayExercises(week);
  return legDayExercises(week);
}

export async function seedDemoUser(): Promise<void> {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    // Patch coaching fields onto existing demo users (upgrade path)
    if (!(existing as any).coachingEnabled) {
      const whatsappTo = (process.env.TWILIO_WHATSAPP_TO || '').replace('whatsapp:', '') || '+919137670761';
      await User.updateOne({ email: DEMO_EMAIL }, {
        $set: {
          whatsapp:                    whatsappTo,
          coachingEnabled:             true,
          coachPersonality:            'motivational',
          preferredMorningWorkoutTime: '06:30',
          preferredEveningWorkoutTime: '19:00',
          timezone:                    'Asia/Kolkata',
          dietRemindersEnabled:        true,
          waterRemindersEnabled:       true,
          dailyWaterTarget:            4,
        },
      });
      console.log('Demo user coaching fields patched');
    }
    console.log('Demo user already seeded — skipping full seed');
    return;
  }

  console.log('Seeding demo user (Alex Johnson)…');

  // ── 1. User + measurements — non-linear weight progression ──────────────
  // Plateau in weeks 3-4, small uptick week 8 (social weekend), steady after
  const weightByWeek = [85.0, 84.3, 83.8, 83.5, 83.8, 83.2, 82.0, 81.5, 81.8, 81.8, 80.5, 79.8, 78.8, 78.5];
  const waistByWeek  = [38.0, 37.6, 37.2, 37.0, 37.1, 36.8, 36.2, 35.8, 35.9, 35.8, 35.2, 34.8, 34.3, 34.0];
  const bfByWeek     = [24.0, 23.5, 23.0, 22.8, 22.9, 22.4, 21.8, 21.2, 21.3, 21.1, 20.5, 19.8, 19.0, 18.5];

  const measurements = weightByWeek.map((weight, week) => ({
    date:      daysAgo((13 - week) * 7),
    weight,
    height:    178,
    waistline: waistByWeek[week],
    neck:      38,
    hips:      parseFloat((102 - week * 0.25).toFixed(1)),
    bodyFat:   bfByWeek[week],
  }));

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const whatsappTo = (process.env.TWILIO_WHATSAPP_TO || '').replace('whatsapp:', '') || '+919137670761';
  const user = new User({
    name:              DEMO_NAME,
    email:             DEMO_EMAIL,
    password:          hashedPassword,
    isDemoUser:        true,
    age:               26,
    gender:            'male',
    weeklyWorkoutGoal: 4,
    goals:             'fat_loss',
    measurements,
    // AI Coach
    whatsapp:                    whatsappTo,
    coachingEnabled:             true,
    coachPersonality:            'motivational',
    preferredMorningWorkoutTime: '06:30',
    preferredEveningWorkoutTime: '19:00',
    timezone:                    'Asia/Kolkata',
    dietRemindersEnabled:        true,
    waterRemindersEnabled:       true,
    dailyWaterTarget:            4,
  });
  await user.save();
  const userId = user._id;

  // ── 2. Templates ─────────────────────────────────────────────────────────
  await Workout.insertMany([
    {
      userId, name: 'Push Day', split: 'Push', status: 'template',
      exercises: [
        { name: 'Flat Bench Press',       muscleGroup: 'Chest',     restTime: 120, sets: [{ reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }] },
        { name: 'Incline Dumbbell Press', muscleGroup: 'Chest',     restTime: 90,  sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Cable Crossovers',       muscleGroup: 'Chest',     restTime: 60,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
        { name: 'Overhead Press',         muscleGroup: 'Shoulders', restTime: 120, sets: [{ reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }] },
        { name: 'Lateral Raises',         muscleGroup: 'Shoulders', restTime: 60,  sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 15, weight: 0 }] },
        { name: 'Tricep Pushdowns',       muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
        { name: 'Overhead Extensions',    muscleGroup: 'Triceps',   restTime: 60,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
      ],
    },
    {
      userId, name: 'Pull Day', split: 'Pull', status: 'template',
      exercises: [
        { name: 'Deadlift',      muscleGroup: 'Back',       restTime: 180, sets: [{ reps: 5,  weight: 0 }, { reps: 5,  weight: 0 }, { reps: 5,  weight: 0 }] },
        { name: 'Barbell Rows',  muscleGroup: 'Back',       restTime: 120, sets: [{ reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }] },
        { name: 'Lat Pulldowns', muscleGroup: 'Back',       restTime: 90,  sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Face Pulls',    muscleGroup: 'Rear Delts', restTime: 60,  sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 15, weight: 0 }] },
        { name: 'Barbell Curls', muscleGroup: 'Biceps',     restTime: 90,  sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Hammer Curls',  muscleGroup: 'Biceps',     restTime: 60,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
      ],
    },
    {
      userId, name: 'Leg Day', split: 'Legs', status: 'template',
      exercises: [
        { name: 'Barbell Squats',       muscleGroup: 'Quads',      restTime: 180, sets: [{ reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }, { reps: 8,  weight: 0 }] },
        { name: 'Leg Press',            muscleGroup: 'Quads',      restTime: 120, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Leg Extensions',       muscleGroup: 'Quads',      restTime: 60,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
        { name: 'Romanian Deadlifts',   muscleGroup: 'Hamstrings', restTime: 120, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Lying Leg Curls',      muscleGroup: 'Hamstrings', restTime: 90,  sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
        { name: 'Barbell Hip Thrusts',  muscleGroup: 'Glutes',     restTime: 120, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
        { name: 'Standing Calf Raises', muscleGroup: 'Calves',     restTime: 60,  sets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 15, weight: 0 }] },
      ],
    },
  ]);

  // ── 3. Completed workout history ──────────────────────────────────────────
  // 36 total workouts: 31 old (days 7-69) + 5 streak (days 1-5)
  // Day 6 is deliberately skipped so streak = 5
  // Week 5 (days 35-42): only 2 workouts — simulates a recovery/burnout week
  const splits: ('Push' | 'Pull' | 'Legs')[] = ['Push', 'Pull', 'Legs'];

  const oldWorkoutDays: number[] = [
    // Week 10 (8-13 days ago): 4 workouts
    8, 9, 11, 13,
    // Week 9 (14-20): 3 workouts
    14, 16, 18,
    // Week 8 (21-27): 4 workouts (incl. uptick week in weight)
    21, 22, 24, 26,
    // Week 7 (28-34): 3 workouts
    28, 30, 32,
    // Week 6 (35-41): 4 workouts
    35, 36, 38, 40,
    // Week 5 (42-48): 2 workouts — burnout/deload
    43, 46,
    // Week 4 (49-55): 4 workouts
    49, 51, 52, 54,
    // Week 3 (56-62): 4 workouts
    57, 58, 60, 62,
    // Week 2 (63-69): 3 workouts
    63, 65, 67,
  ];

  const completedWorkouts = oldWorkoutDays.map((daysBack, idx) => {
    const split = splits[idx % 3];
    const week  = Math.round((70 - daysBack) / 7);
    return {
      userId,
      name:      `${split} Day`,
      split,
      status:    'completed',
      date:      daysAgo(daysBack, 10 + (idx % 3)),
      duration:  42 + (idx % 7) * 3,
      exercises: exForSplit(split, Math.max(0, week)),
    };
  });

  // 5-day streak: days 5, 4, 3, 2, 1
  const streakDays = [5, 4, 3, 2, 1];
  streakDays.forEach((daysBack, idx) => {
    const split = splits[(oldWorkoutDays.length + idx) % 3];
    const week  = 9 + Math.floor(idx / 3);
    completedWorkouts.push({
      userId,
      name:      `${split} Day`,
      split,
      status:    'completed',
      date:      daysAgo(daysBack, 11),
      duration:  50 + idx * 3,
      exercises: exForSplit(split, week),
    });
  });

  await Workout.insertMany(completedWorkouts);

  // ── 4. Active workout (Push Day, mid-session) ─────────────────────────────
  await new Workout({
    userId,
    name:   'Push Day',
    split:  'Push',
    status: 'active',
    date:   new Date(),
    exercises: [
      { name: 'Flat Bench Press',       muscleGroup: 'Chest',     restTime: 120,
        sets: [{ reps: 8, weight: 80, completed: true  },
               { reps: 8, weight: 80, completed: true  },
               { reps: 7, weight: 82.5, completed: true },
               { reps: 0, weight: 82.5, completed: false }] },
      { name: 'Incline Dumbbell Press', muscleGroup: 'Chest',     restTime: 90,
        sets: [{ reps: 10, weight: 35, completed: false },
               { reps: 10, weight: 35, completed: false },
               { reps: 10, weight: 35, completed: false }] },
      { name: 'Cable Crossovers',       muscleGroup: 'Chest',     restTime: 60,
        sets: [{ reps: 12, weight: 20, completed: false },
               { reps: 12, weight: 20, completed: false },
               { reps: 12, weight: 20, completed: false }] },
      { name: 'Overhead Press',         muscleGroup: 'Shoulders', restTime: 120,
        sets: [{ reps: 8, weight: 58, completed: false },
               { reps: 8, weight: 58, completed: false },
               { reps: 8, weight: 58, completed: false }] },
      { name: 'Lateral Raises',         muscleGroup: 'Shoulders', restTime: 60,
        sets: [{ reps: 15, weight: 14, completed: false },
               { reps: 15, weight: 14, completed: false },
               { reps: 15, weight: 14, completed: false }] },
      { name: 'Tricep Pushdowns',       muscleGroup: 'Triceps',   restTime: 60,
        sets: [{ reps: 12, weight: 25, completed: false },
               { reps: 12, weight: 25, completed: false },
               { reps: 12, weight: 25, completed: false }] },
    ],
  }).save();

  // ── 5. Diet — last 14 days: 11 logged, 3 missed, varied quality ──────────
  // Full days, partial days, one cheat day, some skipped entirely
  const fullMealPlanA = {
    waterIntake: 3.2,
    meals: [
      { name: 'Oats, banana, whey shake',             time: 'Breakfast', calories: 480, protein: 38, carbs: 62, fats: 10 },
      { name: 'Grilled chicken rice bowl + broccoli', time: 'Lunch',     calories: 620, protein: 54, carbs: 70, fats: 14 },
      { name: 'Dal, brown rice, paneer sabzi',         time: 'Dinner',    calories: 580, protein: 30, carbs: 76, fats: 12 },
      { name: 'Greek yogurt + almonds',               time: 'Snack',     calories: 210, protein: 14, carbs: 18, fats:  9 },
      { name: 'Whey protein shake',                   time: 'Snack',     calories: 130, protein: 25, carbs:  5, fats:  2 },
    ],
  };
  const fullMealPlanB = {
    waterIntake: 3.5,
    meals: [
      { name: 'Eggs, whole wheat toast, OJ',          time: 'Breakfast', calories: 460, protein: 30, carbs: 52, fats: 14 },
      { name: 'Tuna salad wrap',                      time: 'Lunch',     calories: 590, protein: 46, carbs: 58, fats: 16 },
      { name: 'Chicken curry, roti, cucumber raita',  time: 'Dinner',    calories: 620, protein: 42, carbs: 72, fats: 18 },
      { name: 'Banana + peanut butter',               time: 'Snack',     calories: 250, protein:  8, carbs: 34, fats: 10 },
      { name: 'Casein protein shake',                 time: 'Snack',     calories: 120, protein: 24, carbs:  4, fats:  1 },
    ],
  };
  const cheatDay = {
    waterIntake: 2.0,
    meals: [
      { name: 'Pancakes, bacon, orange juice',        time: 'Breakfast', calories: 720, protein: 24, carbs: 92, fats: 28 },
      { name: 'Pizza (3 slices)',                      time: 'Lunch',     calories: 810, protein: 36, carbs: 98, fats: 32 },
      { name: 'Butter chicken + naan',                time: 'Dinner',    calories: 780, protein: 44, carbs: 88, fats: 26 },
      { name: 'Ice cream + cookies',                  time: 'Snack',     calories: 480, protein:  8, carbs: 72, fats: 20 },
    ],
  };
  const partialDay = {
    waterIntake: 2.0,
    meals: [
      { name: 'Poha with peanuts',                    time: 'Breakfast', calories: 380, protein: 12, carbs: 60, fats:  8 },
      { name: 'Leftover dal + roti',                  time: 'Lunch',     calories: 440, protein: 18, carbs: 58, fats: 12 },
    ],
  };

  // Days 0-13 (today=0, 13=oldest): 0,1,2,3=full; 4=partial; 5=full; 6=SKIP; 7=full; 8=cheat; 9=full; 10=partial; 11=SKIP; 12=full; 13=full
  const dietSchedule: { day: number; plan: typeof fullMealPlanA } | null[] = [
    { day: 0,  plan: fullMealPlanA },
    { day: 1,  plan: fullMealPlanB },
    { day: 2,  plan: fullMealPlanA },
    { day: 3,  plan: fullMealPlanB },
    { day: 4,  plan: partialDay    },
    { day: 5,  plan: fullMealPlanA },
    // day 6: SKIP
    { day: 7,  plan: fullMealPlanB },
    { day: 8,  plan: cheatDay      },
    { day: 9,  plan: fullMealPlanA },
    { day: 10, plan: partialDay    },
    // day 11: SKIP
    { day: 12, plan: fullMealPlanB },
    { day: 13, plan: fullMealPlanA },
  ] as any[];

  const diets = (dietSchedule as any[]).filter(Boolean).map((entry: any) => ({
    userId,
    date:       daysAgo(entry.day, 23),
    waterIntake: entry.plan.waterIntake,
    meals:      entry.plan.meals,
  }));
  await Diet.insertMany(diets);

  console.log('✓ Demo user seeded (realistic)');
  console.log(`  Completed workouts: ${completedWorkouts.length}`);
  console.log(`  Measurements: ${measurements.length} entries`);
  console.log(`  Diet entries: ${diets.length} / 14 days`);
}
