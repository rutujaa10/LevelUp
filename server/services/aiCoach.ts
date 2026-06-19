import { GoogleGenAI } from '@google/genai';

export interface CoachContext {
  userName: string;
  goal: string;
  personality: string;
  currentStreak: number;
  highestStreak: number;
  weeklyGoal: number;
  workoutsThisWeek: number;
  missedDays: number;
  currentWeight?: number;
  lastStyle?: string;
  messageType:
    | 'morning_reminder'
    | 'evening_reminder'
    | 'water_reminder'
    | 'diet_reminder'
    | 'reactivation'
    | 'streak_achievement'
    | 'weekly_goal_achievement';
  // water
  waterConsumed?: number;
  waterTarget?: number;
  // diet
  calories?: { consumed: number; target: number };
  protein?: { consumed: number; target: number };
  // achievement
  achievementValue?: number | string;
}

export interface CoachResult {
  message: string;
  style: string;
}

const STYLES = ['coach', 'friend', 'discipline', 'funny', 'competitive', 'inspirational'];

const STYLE_DESCRIPTIONS: Record<string, string> = {
  coach: 'a professional fitness coach: authoritative, data-driven, specific',
  friend: 'a supportive best friend: warm, casual, genuinely caring',
  discipline: 'a tough drill sergeant: no excuses, push through resistance with accountability',
  funny: 'a witty trainer: use humor and light sarcasm to motivate',
  competitive: 'a competitive athlete: challenge them to beat their own personal records',
  inspirational: 'an inspirational figure: connect fitness to identity, purpose, and self-respect',
};

function trimToLastSentence(text: string): string {
  const match = text.match(/^(.*[.!?])\s*/s);
  return match ? match[1].trim() : '';
}

export async function generateCoachMessage(ctx: CoachContext): Promise<CoachResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const lastIdx = STYLES.indexOf(ctx.lastStyle || '');
  const style = STYLES[(lastIdx + 1) % STYLES.length];

  const goalMap: Record<string, string> = {
    fat_loss: 'fat loss',
    muscle_gain: 'muscle gain',
    maintenance: 'staying fit',
  };

  const systemInstruction = `You are ${STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.coach}. The user prefers a "${ctx.personality}" coaching style.

STRICT RULES:
- Write 1 to 3 sentences MAXIMUM. Never more.
- Always reference at least one specific number from the user's actual data (streak, weight, goal, etc).
- NEVER write generic phrases like "Time to workout", "Stay hydrated", "Keep going", or "Great job".
- No markdown, no bullet points, no headers. Plain WhatsApp text only.
- Do not open with a greeting like "Hey [name]!" unless it flows naturally for this style.
- Write like a real human texted this — not an automated notification.
- Each message must feel different from the last. Vary structure, tone, and opening.`;

  const missedNote = ctx.missedDays > 0
    ? `They haven't worked out for ${ctx.missedDays} consecutive day${ctx.missedDays > 1 ? 's' : ''}.`
    : `Current streak: ${ctx.currentStreak} days.`;

  const typePrompts: Record<string, string> = {
    morning_reminder:
      `Morning workout motivation for ${ctx.userName}. ${missedNote} Personal best: ${ctx.highestStreak} days. This week: ${ctx.workoutsThisWeek}/${ctx.weeklyGoal} workouts done.`,

    evening_reminder:
      `Evening urgency message for ${ctx.userName}. No workout today yet — their ${ctx.currentStreak}-day streak ends at midnight if they skip.`,

    reactivation:
      ctx.missedDays >= 7
        ? `Gentle "we miss you" reactivation for ${ctx.userName}. They've been away ${ctx.missedDays} days. No guilt — just invite them back. Suggest starting with just 15–20 minutes.`
        : `Accountability message for ${ctx.userName}. They built a ${ctx.highestStreak}-day personal best and have been inactive for ${ctx.missedDays} days. Reference the momentum they were building.`,

    water_reminder:
      `Hydration check for ${ctx.userName}. Consumed: ${ctx.waterConsumed}L of ${ctx.waterTarget}L daily goal. Remaining: ${((ctx.waterTarget ?? 0) - (ctx.waterConsumed ?? 0)).toFixed(1)}L.`,

    diet_reminder:
      `Nutrition check-in for ${ctx.userName}. Calories: ${ctx.calories?.consumed ?? 0}/${ctx.calories?.target ?? 0}. Protein: ${ctx.protein?.consumed ?? 0}g/${ctx.protein?.target ?? 0}g.${
        ctx.protein && ctx.protein.consumed < ctx.protein.target
          ? ` They're ${ctx.protein.target - ctx.protein.consumed}g short on protein — suggest a specific food that would close the gap.`
          : ''
      }`,

    streak_achievement:
      `Celebrate ${ctx.userName}'s ${ctx.achievementValue}-day workout streak milestone! Make it feel like a genuine achievement, not a generic congrats. Reference that their previous best was ${ctx.highestStreak} days.`,

    weekly_goal_achievement:
      `${ctx.userName} just completed their weekly goal: ${ctx.workoutsThisWeek}/${ctx.weeklyGoal} workouts. Short, punchy celebration — make it feel earned.`,
  };

  const userPrompt = `User data:
- Name: ${ctx.userName}
- Goal: ${goalMap[ctx.goal] || ctx.goal}
- Current streak: ${ctx.currentStreak} days
- Personal best streak: ${ctx.highestStreak} days
- This week: ${ctx.workoutsThisWeek}/${ctx.weeklyGoal} workouts
${ctx.currentWeight ? `- Current weight: ${ctx.currentWeight}kg` : ''}
${ctx.missedDays > 0 ? `- Missed days in a row: ${ctx.missedDays}` : ''}

Task: ${typePrompts[ctx.messageType]}

Write the WhatsApp message now (plain text, 1–3 sentences):`;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: { systemInstruction, maxOutputTokens: 400, temperature: 0.9 },
    });
    const raw = response.text?.trim() ?? '';
    // Trim to last complete sentence so messages never end mid-word
    const message = trimToLastSentence(raw) || raw;
    return { message, style };
  } catch (err: any) {
    console.error('[Coach] Gemini error, using fallback message:', err?.message ?? err);
    return { message: getFallbackMessage(ctx), style };
  }
}

function getFallbackMessage(ctx: CoachContext): string {
  const n = ctx.userName;
  switch (ctx.messageType) {
    case 'morning_reminder':
      return ctx.currentStreak > 0
        ? `${n}, you're on a ${ctx.currentStreak}-day streak — don't break it today. Time to train.`
        : `${n}, today is a great day to start. Even 20 minutes counts — let's go.`;
    case 'evening_reminder':
      return `${n}, the day's not over yet. You still have time to get your workout in before midnight.`;
    case 'reactivation':
      return `${n}, it's been ${ctx.missedDays} days. No pressure — just start small. 15 minutes is enough to get back on track.`;
    case 'water_reminder':
      return `${n}, you're at ${ctx.waterConsumed}L of your ${ctx.waterTarget}L goal. Grab some water now.`;
    case 'diet_reminder':
      return `${n}, ${ctx.calories?.consumed ?? 0} of ${ctx.calories?.target ?? 0} kcal logged today. ${(ctx.protein?.consumed ?? 0) < (ctx.protein?.target ?? 0) ? `Protein is at ${ctx.protein?.consumed ?? 0}g — try to hit ${ctx.protein?.target ?? 0}g.` : 'Keep it up.'}`;
    case 'streak_achievement':
      return `${n}, ${ctx.achievementValue} days straight. That's not luck — that's a habit. Keep going.`;
    case 'weekly_goal_achievement':
      return `${n}, ${ctx.workoutsThisWeek}/${ctx.weeklyGoal} workouts done this week. Goal complete.`;
    default:
      return `${n}, your LevelUp coach checking in. Stay consistent today.`;
  }
}
