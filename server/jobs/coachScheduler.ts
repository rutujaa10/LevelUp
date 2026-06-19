import cron from 'node-cron';
import { User } from '../models/User.js';
import { Workout } from '../models/Workout.js';
import { Diet } from '../models/Diet.js';
import { generateCoachMessage, CoachContext } from '../services/aiCoach.js';
import { sendWhatsApp } from '../services/twilioService.js';

const CAPS = { workout: 2, diet: 3, water: 3, total: 6 };
const STREAK_MILESTONES = [3, 5, 7, 14, 21, 30, 50, 100];

// ── Timezone helpers ──────────────────────────────────────────────────────────

function localDateStr(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

function localHHMM(tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}

function localHour(tz: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date()),
    10,
  );
}

// Fires on the first cron tick at or after the target time, within a 10-minute
// window (cron runs every 5 min, so worst-case delay is ~5 min after target).
function isTimeReached(target: string, current: string): boolean {
  if (!target || !current) return false;
  const [th, tm] = target.split(':').map(Number);
  const [ch, cm] = current.split(':').map(Number);
  const diff = (ch * 60 + cm) - (th * 60 + tm);
  return diff >= 0 && diff <= 10;
}

function hoursSince(d?: Date | null): number {
  if (!d) return Infinity;
  return (Date.now() - new Date(d).getTime()) / 3_600_000;
}

function weekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function getWorkoutStats(userId: any, tz: string, todayStr: string) {
  const workouts = await Workout.find({ userId, status: 'completed' }).sort({ date: -1 }).limit(200);

  const daySet = new Set<string>();
  for (const w of workouts) {
    daySet.add(new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(w.date)));
  }

  // Current streak — skip today if not yet logged
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
    if (daySet.has(ds)) { currentStreak++; }
    else if (i === 0) { continue; }
    else { break; }
  }

  // Highest ever streak
  const sorted = [...daySet].sort();
  let maxStreak = sorted.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000;
    run = diff === 1 ? run + 1 : 1;
    if (run > maxStreak) maxStreak = run;
  }

  // Workouts this week (Mon–Sun)
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= mon).length;

  // Consecutive missed days before today
  let missedDays = 0;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
    if (daySet.has(ds)) break;
    missedDays++;
  }

  return {
    hasWorkoutToday: daySet.has(todayStr),
    currentStreak,
    highestStreak: maxStreak,
    workoutsThisWeek,
    missedDays,
  };
}

async function getTodayDiet(userId: any, todayStr: string) {
  const start = new Date(todayStr);
  const end = new Date(todayStr);
  end.setDate(end.getDate() + 1);
  const diet = await Diet.findOne({ userId, date: { $gte: start, $lt: end } });
  if (!diet) return null;
  const meals = diet.meals as any[];
  return {
    calories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
    protein: meals.reduce((s, m) => s + (m.protein ?? 0), 0),
    waterIntake: (diet as any).waterIntake ?? 0,
  };
}

function latestWeight(user: any): number | undefined {
  const m: any[] = user.measurements ?? [];
  return m.length ? m[m.length - 1].weight : undefined;
}

function estimateTargets(user: any, wt?: number) {
  const lastMeasurement = (user.measurements as any[] ?? []).slice(-1)[0];
  const h = lastMeasurement?.height;
  let cals = 2000;
  if (wt && h && user.age && user.gender) {
    const bmr =
      user.gender === 'female'
        ? 10 * wt + 6.25 * h - 5 * user.age - 161
        : 10 * wt + 6.25 * h - 5 * user.age + 5;
    cals = Math.round(bmr * 1.55);
  }
  return { calories: cals, protein: Math.round((wt ?? 70) * 2) };
}

// ── Core dispatch ─────────────────────────────────────────────────────────────

async function dispatch(user: any, ctx: CoachContext, field: string) {
  const result = await generateCoachMessage(ctx);
  await sendWhatsApp(user.whatsapp, result.message);

  const t = user.notificationTracking ?? {};
  const setFields: Record<string, any> = {
    'notificationTracking.totalSent': (t.totalSent ?? 0) + 1,
    'notificationTracking.lastCoachStyle': result.style,
  };

  if (field === 'morning') setFields['notificationTracking.morningReminderSent'] = true;
  if (field === 'evening') setFields['notificationTracking.eveningReminderSent'] = true;
  if (field === 'water') {
    setFields['notificationTracking.waterRemindersSent'] = (t.waterRemindersSent ?? 0) + 1;
    setFields['notificationTracking.lastWaterReminderSentAt'] = new Date();
  }
  if (field === 'diet') {
    setFields['notificationTracking.dietRemindersSent'] = (t.dietRemindersSent ?? 0) + 1;
    setFields['notificationTracking.lastDietReminderSentAt'] = new Date();
  }

  await User.updateOne({ _id: user._id }, { $set: setFields });
  console.log(`[Coach] ${user.name} | ${field} | ${result.message.slice(0, 70)}…`);
}

// ── Per-user processing ───────────────────────────────────────────────────────

async function processUser(user: any) {
  const tz = user.timezone || 'Asia/Kolkata';
  const todayStr = localDateStr(tz);
  const hhmm = localHHMM(tz);
  const hour = localHour(tz);

  console.log(`[Coach] ${user.name} | tz=${tz} time=${hhmm} today=${todayStr}`);

  // Reset daily tracking on new day (preserve cross-day fields)
  const t = user.notificationTracking ?? {};
  if (t.date !== todayStr) {
    // Set water/diet last-sent to now on daily reset so they don't fire immediately
    const startOfDayDelay = new Date();
    await User.updateOne({ _id: user._id }, {
      $set: {
        'notificationTracking.date': todayStr,
        'notificationTracking.totalSent': 0,
        'notificationTracking.workoutRemindersSent': 0,
        'notificationTracking.dietRemindersSent': 0,
        'notificationTracking.waterRemindersSent': 0,
        'notificationTracking.morningReminderSent': false,
        'notificationTracking.eveningReminderSent': false,
        'notificationTracking.waterGoalMessageSent': false,
        'notificationTracking.lastWaterReminderSentAt': startOfDayDelay,
        'notificationTracking.lastDietReminderSentAt': startOfDayDelay,
      },
    });
    Object.assign(t, {
      date: todayStr,
      totalSent: 0,
      workoutRemindersSent: 0,
      dietRemindersSent: 0,
      waterRemindersSent: 0,
      morningReminderSent: false,
      eveningReminderSent: false,
      waterGoalMessageSent: false,
      lastWaterReminderSentAt: startOfDayDelay,
      lastDietReminderSentAt: startOfDayDelay,
    });
  }

  if ((t.totalSent ?? 0) >= CAPS.total) return;

  const stats = await getWorkoutStats(user._id, tz, todayStr);
  const wt = latestWeight(user);

  const baseCtx: Omit<CoachContext, 'messageType'> = {
    userName: user.name.split(' ')[0],
    goal: user.goals || 'maintenance',
    personality: user.coachPersonality || 'motivational',
    currentStreak: stats.currentStreak,
    highestStreak: stats.highestStreak,
    weeklyGoal: user.weeklyWorkoutGoal || 4,
    workoutsThisWeek: stats.workoutsThisWeek,
    missedDays: stats.missedDays,
    currentWeight: wt,
    lastStyle: t.lastCoachStyle || '',
  };

  // ── Achievement: streak milestone ─────────────────────────────────────────
  if (stats.hasWorkoutToday) {
    const milestone = STREAK_MILESTONES.find(
      m => m > (t.lastStreakMilestoneSent ?? 0) && stats.currentStreak >= m,
    );
    if (milestone) {
      await dispatch(user, { ...baseCtx, messageType: 'streak_achievement', achievementValue: milestone }, 'achievement');
      await User.updateOne({ _id: user._id }, { $set: { 'notificationTracking.lastStreakMilestoneSent': milestone } });
      return;
    }
  }

  // ── Achievement: weekly goal ──────────────────────────────────────────────
  const thisWeek = weekKey();
  if (stats.workoutsThisWeek >= (user.weeklyWorkoutGoal ?? 4) && t.weeklyGoalSentWeek !== thisWeek) {
    await dispatch(user, { ...baseCtx, messageType: 'weekly_goal_achievement' }, 'achievement');
    await User.updateOne({ _id: user._id }, { $set: { 'notificationTracking.weeklyGoalSentWeek': thisWeek } });
    return;
  }

  // ── Morning workout reminder ──────────────────────────────────────────────
  if (user.preferredMorningWorkoutTime && !t.morningReminderSent && !stats.hasWorkoutToday) {
    if (isTimeReached(user.preferredMorningWorkoutTime, hhmm)) {
      const type = stats.missedDays >= 3 ? 'reactivation' : 'morning_reminder';
      await dispatch(user, { ...baseCtx, messageType: type }, 'morning');
      return;
    }
  }

  // ── Evening workout reminder ──────────────────────────────────────────────
  if (user.preferredEveningWorkoutTime && !t.eveningReminderSent && !stats.hasWorkoutToday) {
    if (isTimeReached(user.preferredEveningWorkoutTime, hhmm)) {
      await dispatch(user, { ...baseCtx, messageType: 'evening_reminder' }, 'evening');
      return;
    }
  }

  // ── Reactivation fallback — no workout times set, fire at 9am ────────────
  if (
    stats.missedDays >= 3 &&
    !t.morningReminderSent &&
    !user.preferredMorningWorkoutTime &&
    !user.preferredEveningWorkoutTime &&
    hour === 9
  ) {
    await dispatch(user, { ...baseCtx, messageType: 'reactivation' }, 'morning');
    return;
  }

  // ── Water reminder (every 4h, 8am–10pm) ──────────────────────────────────
  if (user.waterRemindersEnabled !== false && (t.waterRemindersSent ?? 0) < CAPS.water) {
    if (hour >= 8 && hour <= 22 && hoursSince(t.lastWaterReminderSentAt) >= 4) {
      const diet = await getTodayDiet(user._id, todayStr);
      const consumed = diet?.waterIntake ?? 0;
      const target = user.dailyWaterTarget ?? 4;

      if (consumed >= target && !t.waterGoalMessageSent) {
        const msg = `${baseCtx.userName}, ${target}L water goal done for the day. That's exactly the kind of discipline that compounds.`;
        await sendWhatsApp(user.whatsapp, msg);
        await User.updateOne({ _id: user._id }, {
          $set: {
            'notificationTracking.waterGoalMessageSent': true,
            'notificationTracking.totalSent': (t.totalSent ?? 0) + 1,
          },
        });
        return;
      }

      if (consumed < target) {
        await dispatch(user, {
          ...baseCtx,
          messageType: 'water_reminder',
          waterConsumed: parseFloat(consumed.toFixed(2)),
          waterTarget: target,
        }, 'water');
        return;
      }
    }
  }

  // ── Diet reminder (every 4h, 10am–8pm) ───────────────────────────────────
  if (user.dietRemindersEnabled !== false && (t.dietRemindersSent ?? 0) < CAPS.diet) {
    if (hour >= 10 && hour <= 20 && hoursSince(t.lastDietReminderSentAt) >= 4) {
      const diet = await getTodayDiet(user._id, todayStr);
      if (diet) {
        const targets = estimateTargets(user, wt);
        await dispatch(user, {
          ...baseCtx,
          messageType: 'diet_reminder',
          calories: { consumed: diet.calories, target: targets.calories },
          protein: { consumed: diet.protein, target: targets.protein },
        }, 'diet');
        return;
      }
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

async function runCoachCheck() {
  const users = await User.find({ coachingEnabled: true, whatsapp: { $exists: true, $ne: '' } });
  for (const user of users) {
    try {
      await processUser(user);
    } catch (err) {
      console.error(`[Coach] Error for ${user.name}:`, err);
    }
  }
}

export function startCoachScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runCoachCheck();
    } catch (err) {
      console.error('[Coach] Scheduler error:', err);
    }
  });
  console.log('[Coach] AI accountability scheduler started — checks every 5 minutes');
}
